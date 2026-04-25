import { describe, expect, it } from 'vitest'

import { createClient } from '../../src/client'
import { OAUTH_TOKEN, PCLOUD_TOKEN } from '../shared/fixtures'
import { runScenario } from '../shared/scenario'

describe('scenario: listfolder', () => {
	it('runs with oauth-mode client (?access_token=)', async () => {
		const client = createClient({ token: OAUTH_TOKEN, type: 'oauth' })
		const { root } = await runScenario(client)
		expect(root.folderid).toBe(0)
		expect(root.isfolder).toBe(true)
		expect(root.contents?.length).toBeGreaterThan(0)
	})

	it('runs with pcloud-mode client (?auth=)', async () => {
		const client = createClient({ token: PCLOUD_TOKEN, type: 'pcloud' })
		const { root } = await runScenario(client)
		expect(root.folderid).toBe(0)
		expect(root.isfolder).toBe(true)
	})

	it('rejects an unknown token (handler returns 1000)', async () => {
		const client = createClient({ token: 'bogus', type: 'oauth' })
		await expect(runScenario(client)).rejects.toMatchObject({
			name: 'PcloudApiError',
			result: 1000,
		})
	})
})
