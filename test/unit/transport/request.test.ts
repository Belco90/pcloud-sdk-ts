import { describe, it, expect, vi, beforeEach } from 'vitest'

import { PcloudApiError, PcloudNetworkError } from '../../../src/errors'
import { apiRequest } from '../../../src/transport/request'
import { mockFetch, apiOk, apiErr } from '../../fixtures/responses'

beforeEach(() => {
	vi.restoreAllMocks()
})

describe('apiRequest', () => {
	it('returns parsed JSON on success', async () => {
		vi.stubGlobal('fetch', mockFetch(apiOk({ userinfo: true })))

		const result = await apiRequest<{ userinfo: boolean }>('api.pcloud.com', 'userinfo')
		expect(result).toMatchObject({ userinfo: true })
	})

	it('throws PcloudApiError when result !== 0', async () => {
		vi.stubGlobal('fetch', mockFetch(apiErr(2005, 'File not found')))

		await expect(
			apiRequest('api.pcloud.com', 'getfilelink', { params: { fileid: '42' } }),
		).rejects.toThrow(PcloudApiError)
	})

	it('throws PcloudNetworkError on non-2xx HTTP', async () => {
		vi.stubGlobal('fetch', () =>
			Promise.resolve(
				new Response('Server Error', { status: 503, headers: { 'Content-Type': 'text/plain' } }),
			),
		)

		await expect(apiRequest('api.pcloud.com', 'userinfo')).rejects.toThrow(PcloudNetworkError)
	})

	it('throws PcloudNetworkError on network failure', async () => {
		vi.stubGlobal('fetch', () => Promise.reject(new Error('Failed to fetch')))

		await expect(apiRequest('api.pcloud.com', 'userinfo')).rejects.toThrow(PcloudNetworkError)
	})

	it('returns text when responseType is text', async () => {
		vi.stubGlobal('fetch', () => Promise.resolve(new Response('hello text', { status: 200 })))

		const result = await apiRequest<string>('api.pcloud.com', 'getthumbs', {
			responseType: 'text',
			noCoalesce: true,
		})
		expect(result).toBe('hello text')
	})

	it('coalesces concurrent read GET requests', async () => {
		let fetchCount = 0
		vi.stubGlobal('fetch', () => {
			fetchCount++
			return Promise.resolve(new Response(JSON.stringify({ result: 0 }), { status: 200 }))
		})

		await Promise.all([
			apiRequest('api.pcloud.com', 'listfolder', { params: { folderid: '0' } }),
			apiRequest('api.pcloud.com', 'listfolder', { params: { folderid: '0' } }),
		])

		expect(fetchCount).toBe(1)
	})

	it('does not coalesce write methods', async () => {
		let fetchCount = 0
		vi.stubGlobal('fetch', () => {
			fetchCount++
			return Promise.resolve(new Response(JSON.stringify({ result: 0 }), { status: 200 }))
		})

		await Promise.all([
			apiRequest('api.pcloud.com', 'createfolder', { params: { name: 'a' } }),
			apiRequest('api.pcloud.com', 'createfolder', { params: { name: 'a' } }),
		])

		expect(fetchCount).toBe(2)
	})
})
