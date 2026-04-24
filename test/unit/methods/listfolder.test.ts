import { describe, it, expect, vi } from 'vitest'

import { createClient } from '../../../src/client'
import { apiOk, mockFetch, FOLDER } from '../../fixtures/responses'

describe('listfolder', () => {
	it('returns folder metadata', async () => {
		vi.stubGlobal('fetch', mockFetch(apiOk({ metadata: FOLDER })))
		const client = createClient({ token: 'test-token' })
		const result = await client.listfolder(0)
		expect(result.folderid).toBe(0)
		expect(result.isfolder).toBe(true)
	})

	it('passes folderid param to API', async () => {
		let capturedUrl = ''
		vi.stubGlobal('fetch', (url: string) => {
			capturedUrl = url
			return Promise.resolve(
				new Response(JSON.stringify(apiOk({ metadata: FOLDER })), { status: 200 }),
			)
		})

		const client = createClient({ token: 'test-token' })
		await client.listfolder(123)
		expect(capturedUrl).toContain('folderid=123')
	})

	it('passes access_token for oauth type', async () => {
		let capturedUrl = ''
		vi.stubGlobal('fetch', (url: string) => {
			capturedUrl = url
			return Promise.resolve(
				new Response(JSON.stringify(apiOk({ metadata: FOLDER })), { status: 200 }),
			)
		})

		const client = createClient({ token: 'mytoken', type: 'oauth' })
		await client.listfolder(0)
		expect(capturedUrl).toContain('access_token=mytoken')
	})

	it('passes auth param for pcloud type', async () => {
		let capturedUrl = ''
		vi.stubGlobal('fetch', (url: string) => {
			capturedUrl = url
			return Promise.resolve(
				new Response(JSON.stringify(apiOk({ metadata: FOLDER })), { status: 200 }),
			)
		})

		const client = createClient({ token: 'mytoken', type: 'pcloud' })
		await client.listfolder(0)
		expect(capturedUrl).toContain('auth=mytoken')
	})

	it('passes recursive=1 when option set', async () => {
		let capturedUrl = ''
		vi.stubGlobal('fetch', (url: string) => {
			capturedUrl = url
			return Promise.resolve(
				new Response(JSON.stringify(apiOk({ metadata: FOLDER })), { status: 200 }),
			)
		})

		const client = createClient({ token: 'test-token' })
		await client.listfolder(0, { recursive: true })
		expect(capturedUrl).toContain('recursive=1')
	})
})
