import { useState } from 'react'

import { createClient } from '../../src'
import { initOauthPollToken } from '../../src/oauth-browser'
import { errorHandlers } from '../shared/handlers'
import { worker } from './worker'

type LogEntry = { label: string; body: string }

interface AppProps {
	realMode: boolean
}

function format(payload: unknown): string {
	const body = payload instanceof Error ? `${payload.name}: ${payload.message}` : payload
	return typeof body === 'string' ? body : JSON.stringify(body, null, 2)
}

export function App({ realMode }: AppProps): React.JSX.Element {
	const [oauthToken, setOauthToken] = useState(realMode ? '' : 'oauth-test-access-token')
	const [pcloudToken, setPcloudToken] = useState(realMode ? '' : 'pcloud-test-token')
	const [log, setLog] = useState<LogEntry>({
		label: 'idle',
		body: realMode
			? 'Real mode: requests will hit the live pCloud API. Paste your token(s) above and pick an action.'
			: 'MSW worker started. Click a button above.',
	})

	function run(label: string, fn: () => Promise<unknown>): () => void {
		return () => {
			void fn()
				.then((result) => {
					setLog({ label, body: format(result) })
				})
				.catch((err: unknown) => {
					setLog({
						label: `${label} (error)`,
						body: format(err instanceof Error ? err : new Error(String(err))),
					})
				})
		}
	}

	const listOauth = run('listfolder via oauth-mode client', async () => {
		const client = createClient({ token: oauthToken, type: 'oauth' })
		return await client.listfolder(0)
	})

	const listPcloud = run('listfolder via pcloud-mode client', async () => {
		const client = createClient({ token: pcloudToken, type: 'pcloud' })
		return await client.listfolder(0)
	})

	const oauthPoll = run('OAuth poll → received token, listed folder', async () => {
		// Suppress the popup: initOauthPollToken would otherwise call window.open
		// to navigate to the real my.pcloud.com authorize page. We only care about
		// the polled fetch, which MSW intercepts.
		const realOpen = window.open
		window.open = () => null
		try {
			const token = await new Promise<string>((resolve, reject) => {
				initOauthPollToken({
					clientId: 'test-client-id',
					receiveToken: (t) => resolve(t),
					onError: reject,
				})
			})
			const client = createClient({ token, type: 'oauth' })
			const root = await client.listfolder(0)
			return { token, root }
		} finally {
			window.open = realOpen
		}
	})

	const triggerError = run('error path', async () => {
		worker.use(...errorHandlers())
		try {
			const client = createClient({ token: oauthToken, type: 'oauth' })
			await client.listfolder(0)
			return 'unexpected success'
		} finally {
			worker.resetHandlers()
		}
	})

	return (
		<>
			<h1>pcloud-sdk-ts — browser scenario</h1>
			<p>
				{realMode ? (
					<>
						<strong>Real mode</strong> — requests are sent to the live pCloud API. The MSW worker is
						not started. The OAuth poll and error-path actions require MSW and are disabled.
					</>
				) : (
					<>
						Requests are intercepted by an MSW service worker and respond with the fixture data from{' '}
						<code>examples/shared/handlers.ts</code>.
					</>
				)}
			</p>

			<fieldset>
				<legend>Token</legend>
				<label>
					OAuth token (sent as <code>?access_token=</code>)
					<input type="text" value={oauthToken} onChange={(e) => setOauthToken(e.target.value)} />
				</label>
				<label>
					pCloud auth token (sent as <code>?auth=</code>)
					<input type="text" value={pcloudToken} onChange={(e) => setPcloudToken(e.target.value)} />
				</label>
			</fieldset>

			<fieldset>
				<legend>Actions</legend>
				<button type="button" onClick={listOauth}>
					List folder (oauth mode)
				</button>
				<button type="button" onClick={listPcloud}>
					List folder (pcloud mode)
				</button>
				<button type="button" onClick={oauthPoll} disabled={realMode}>
					OAuth login (poll flow)
				</button>
				<button type="button" onClick={triggerError} disabled={realMode}>
					Trigger error path
				</button>
			</fieldset>

			<h2>Output</h2>
			<pre>
				{log.label}
				{'\n\n'}
				{log.body}
			</pre>
		</>
	)
}
