import { describe, expect, it } from 'vitest'

import { createClient } from '../../src/client'
import { getTokenFromCode } from '../../src/oauth'
import { APP_SECRET, CLIENT_ID, CODE, OAUTH_TOKEN } from '../shared/fixtures'
import { runScenario } from '../shared/scenario'

describe('scenario: oauth code exchange', () => {
	it('exchanges a code for an access token', async () => {
		const result = await getTokenFromCode(CODE, CLIENT_ID, APP_SECRET)
		expect(result.access_token).toBe(OAUTH_TOKEN)
		expect(result.locationid).toBe(1)
	})

	it('rejects exchange with a wrong app secret', async () => {
		await expect(getTokenFromCode(CODE, CLIENT_ID, 'wrong-secret')).rejects.toMatchObject({
			name: 'PcloudApiError',
			result: 2000,
		})
	})

	it('uses the exchanged token to list a folder', async () => {
		const { access_token } = await getTokenFromCode(CODE, CLIENT_ID, APP_SECRET)
		const client = createClient({ token: access_token, type: 'oauth' })
		const { root } = await runScenario(client)
		expect(root.folderid).toBe(0)
	})
})
