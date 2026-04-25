/* oxlint-disable no-console */
import { createClient } from '../../src/client'
import { PcloudApiError } from '../../src/errors'
import { getTokenFromCode } from '../../src/oauth'
import { assertScenarioResult } from '../shared/expectations'
import { OAUTH_TOKEN, PCLOUD_TOKEN, CLIENT_ID, APP_SECRET, CODE } from '../shared/fixtures'
import { errorHandlers } from '../shared/handlers'
import { runScenario } from '../shared/scenario'
import { server } from './server'

interface RunMode {
	real: boolean
	tokens: {
		oauth?: string
		pcloud?: string
		clientId?: string
		appSecret?: string
		code?: string
	}
}

function parseMode(): RunMode {
	const real = process.argv.includes('--real') || process.env['PCLOUD_REAL'] === '1'
	if (!real) {
		return {
			real: false,
			tokens: {
				oauth: OAUTH_TOKEN,
				pcloud: PCLOUD_TOKEN,
				clientId: CLIENT_ID,
				appSecret: APP_SECRET,
				code: CODE,
			},
		}
	}

	const tokens: RunMode['tokens'] = {}
	if (process.env['PCLOUD_TOKEN']) tokens.oauth = process.env['PCLOUD_TOKEN']
	if (process.env['PCLOUD_AUTH_TOKEN']) tokens.pcloud = process.env['PCLOUD_AUTH_TOKEN']
	if (process.env['PCLOUD_CLIENT_ID']) tokens.clientId = process.env['PCLOUD_CLIENT_ID']
	if (process.env['PCLOUD_APP_SECRET']) tokens.appSecret = process.env['PCLOUD_APP_SECRET']
	if (process.env['PCLOUD_CODE']) tokens.code = process.env['PCLOUD_CODE']
	return { real: true, tokens }
}

function header(label: string): void {
	console.log(`\n=== ${label} ===`)
}

async function step(name: string, fn: () => Promise<void>): Promise<void> {
	process.stdout.write(`  • ${name} ... `)
	try {
		await fn()
		process.stdout.write('ok\n')
	} catch (err) {
		process.stdout.write('FAIL\n')
		throw err
	}
}

async function runOAuthMode(token: string): Promise<void> {
	const client = createClient({ token, type: 'oauth' })
	const result = await runScenario(client)
	assertScenarioResult(result)
	console.log(`    root contains ${String(result.root.contents?.length ?? 0)} entries`)
}

async function runPcloudMode(token: string): Promise<void> {
	const client = createClient({ token, type: 'pcloud' })
	const result = await runScenario(client)
	assertScenarioResult(result)
	console.log(`    root contains ${String(result.root.contents?.length ?? 0)} entries`)
}

async function runOAuthCodeExchange(
	clientId: string,
	appSecret: string,
	code: string,
): Promise<void> {
	const { access_token } = await getTokenFromCode(code, clientId, appSecret)
	console.log(`    received access_token of length ${String(access_token.length)}`)
	const client = createClient({ token: access_token, type: 'oauth' })
	const result = await runScenario(client)
	assertScenarioResult(result)
}

async function runErrorPath(): Promise<void> {
	server.use(...errorHandlers())
	const client = createClient({ token: OAUTH_TOKEN, type: 'oauth' })
	try {
		await client.listfolder(0)
		throw new Error('expected listfolder to throw, but it resolved')
	} catch (err) {
		if (!(err instanceof PcloudApiError) || err.result !== 2005) {
			throw err
		}
		console.log(`    got expected PcloudApiError result=${String(err.result)}`)
	} finally {
		server.resetHandlers()
	}
}

async function main(): Promise<void> {
	const mode = parseMode()

	if (!mode.real) {
		header('Mocked mode (MSW)')
		server.listen({ onUnhandledRequest: 'error' })
	} else {
		header('Real-API mode (no mocking)')
		console.log(
			'  Reading tokens from PCLOUD_TOKEN / PCLOUD_AUTH_TOKEN / PCLOUD_CLIENT_ID / PCLOUD_APP_SECRET / PCLOUD_CODE',
		)
	}

	try {
		if (mode.tokens.oauth) {
			await step('listfolder via oauth-mode client', () => runOAuthMode(mode.tokens.oauth!))
		} else {
			console.log('  • skipping oauth-mode listfolder (no PCLOUD_TOKEN)')
		}

		if (mode.tokens.pcloud) {
			await step('listfolder via pcloud-mode client', () => runPcloudMode(mode.tokens.pcloud!))
		} else {
			console.log('  • skipping pcloud-mode listfolder (no PCLOUD_AUTH_TOKEN)')
		}

		if (mode.tokens.clientId && mode.tokens.appSecret && mode.tokens.code) {
			await step('oauth code exchange + listfolder', () =>
				runOAuthCodeExchange(mode.tokens.clientId!, mode.tokens.appSecret!, mode.tokens.code!),
			)
		} else {
			console.log(
				'  • skipping oauth code exchange (need PCLOUD_CLIENT_ID + PCLOUD_APP_SECRET + PCLOUD_CODE)',
			)
		}

		if (!mode.real) {
			await step('error path (listfolder → result 2005)', runErrorPath)
		}

		console.log('\nAll scenario steps completed.')
	} finally {
		if (!mode.real) server.close()
	}
}

main().catch((err: unknown) => {
	console.error(err)
	process.exit(1)
})
