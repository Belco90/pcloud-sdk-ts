import { describe, it, expect, vi, beforeEach } from 'vitest'

import { createClient } from '../../../src/client'
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

	it('puts auth in the URL but not in error.params on API error', async () => {
		vi.stubGlobal('fetch', mockFetch(apiErr(2005, 'File not found')))

		let caught: unknown
		try {
			await apiRequest('api.pcloud.com', 'getfilelink', {
				params: { fileid: '42' },
				auth: ['access_token', 'SECRET-OAUTH'],
			})
		} catch (err) {
			caught = err
		}

		expect(caught).toBeInstanceOf(PcloudApiError)
		const apiErr1 = caught as PcloudApiError
		expect(apiErr1.params).toEqual({ fileid: '42' })
		expect(apiErr1.params).not.toHaveProperty('access_token')
		expect(apiErr1.message).not.toContain('SECRET-OAUTH')
		expect(
			JSON.stringify({ ...apiErr1, message: apiErr1.message, params: apiErr1.params }),
		).not.toContain('SECRET-OAUTH')
	})

	it('sends the auth value on the wire', async () => {
		let capturedUrl = ''
		vi.stubGlobal('fetch', (url: string) => {
			capturedUrl = url
			return Promise.resolve(new Response(JSON.stringify({ result: 0 }), { status: 200 }))
		})

		await apiRequest('api.pcloud.com', 'userinfo', {
			auth: ['access_token', 'SECRET-OAUTH'],
			noCoalesce: true,
		})

		expect(capturedUrl).toContain('access_token=SECRET-OAUTH')
	})

	it('scrubs access_token from fetch error message and cause', async () => {
		vi.stubGlobal('fetch', () =>
			Promise.reject(
				new TypeError(
					'fetch failed: connect ECONNREFUSED https://api.pcloud.com/userinfo?access_token=SECRET-OAUTH',
				),
			),
		)

		let caught: unknown
		try {
			await apiRequest('api.pcloud.com', 'userinfo', {
				auth: ['access_token', 'SECRET-OAUTH'],
			})
		} catch (err) {
			caught = err
		}

		expect(caught).toBeInstanceOf(PcloudNetworkError)
		const netErr = caught as PcloudNetworkError
		expect(netErr.message).not.toContain('SECRET-OAUTH')
		expect(netErr.message).toContain('access_token=***')
		const cause = netErr.cause as { name: string; message: string }
		expect(cause.name).toBe('TypeError')
		expect(cause.message).not.toContain('SECRET-OAUTH')
		expect(cause.message).toContain('access_token=***')
	})

	it('does not coalesce reads across different clients (per-client scope)', async () => {
		let fetchCount = 0
		vi.stubGlobal('fetch', () => {
			fetchCount++
			return new Promise<Response>((resolve) =>
				setTimeout(
					() =>
						resolve(
							new Response(JSON.stringify(apiOk({ metadata: { folderid: 0 } })), { status: 200 }),
						),
					5,
				),
			)
		})

		const clientA = createClient({ token: 'token-a' })
		const clientB = createClient({ token: 'token-b' })

		await Promise.all([clientA.listfolder(0), clientB.listfolder(0)])

		expect(fetchCount).toBe(2)
	})

	it('still coalesces reads within a single client', async () => {
		let fetchCount = 0
		vi.stubGlobal('fetch', () => {
			fetchCount++
			return new Promise<Response>((resolve) =>
				setTimeout(
					() =>
						resolve(
							new Response(JSON.stringify(apiOk({ metadata: { folderid: 0 } })), { status: 200 }),
						),
					5,
				),
			)
		})

		const client = createClient({ token: 'token-a' })
		await Promise.all([client.listfolder(0), client.listfolder(0)])

		expect(fetchCount).toBe(1)
	})
})
