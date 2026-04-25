import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createClient } from '../../src/client'
import { initOauthPollToken } from '../../src/oauth-browser'
import { CLIENT_ID, OAUTH_TOKEN } from '../shared/fixtures'
import { runScenario } from '../shared/scenario'

describe('browser scenario: oauth poll-token flow', () => {
	let realOpen: typeof window.open

	beforeEach(() => {
		// initOauthPollToken calls window.open to navigate to the authorize page.
		// We only test the polled fetch (intercepted by MSW), so suppress the popup.
		realOpen = window.open
		window.open = () => null
	})

	afterEach(() => {
		window.open = realOpen
	})

	it('receives a token from the polled oauth2_token endpoint', async () => {
		const token = await new Promise<string>((resolve, reject) => {
			initOauthPollToken({
				clientId: CLIENT_ID,
				receiveToken: (t) => resolve(t),
				onError: reject,
			})
		})
		expect(token).toBe(OAUTH_TOKEN)
	})

	it('uses the polled token to list a folder', async () => {
		const token = await new Promise<string>((resolve, reject) => {
			initOauthPollToken({
				clientId: CLIENT_ID,
				receiveToken: (t) => resolve(t),
				onError: reject,
			})
		})
		const client = createClient({ token, type: 'oauth' })
		const { root } = await runScenario(client)
		expect(root.folderid).toBe(0)
	})
})
