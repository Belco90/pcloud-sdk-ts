import { describe, expect, it } from 'vitest'

import { createClient } from '../../src/client'
import { OAUTH_TOKEN } from '../shared/fixtures'
import { errorHandlers } from '../shared/handlers'
import { worker } from './worker'

describe('browser scenario: error path', () => {
	it('throws PcloudApiError when listfolder returns a non-zero result', async () => {
		worker.use(...errorHandlers())

		const client = createClient({ token: OAUTH_TOKEN, type: 'oauth' })
		await expect(client.listfolder(0)).rejects.toMatchObject({
			name: 'PcloudApiError',
			result: 2005,
			method: 'listfolder',
		})
	})
})
