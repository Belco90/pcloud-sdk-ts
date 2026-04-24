import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { buildAuthorizeUrl, getTokenFromCode } from '../../src/oauth'

beforeEach(() => {
	vi.restoreAllMocks()
})

afterEach(() => {
	vi.unstubAllGlobals()
})

describe('buildAuthorizeUrl', () => {
	it('builds the authorize URL with required params', () => {
		const url = buildAuthorizeUrl({
			clientId: 'abc',
			redirectUri: 'https://example.com/cb',
			responseType: 'code',
		})
		expect(url).toContain('client_id=abc')
		expect(url).toContain(encodeURIComponent('https://example.com/cb'))
		expect(url).toContain('response_type=code')
	})
})

describe('getTokenFromCode', () => {
	it('throws when called in a browser-like environment', async () => {
		vi.stubGlobal('window', {})
		await expect(getTokenFromCode('code', 'client', 'secret')).rejects.toThrow(
			/must not be called from a browser/,
		)
	})

	it('sends client_secret in the POST body, not the URL', async () => {
		let capturedUrl = ''
		let capturedInit: RequestInit | undefined
		vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
			capturedUrl = url
			capturedInit = init
			return Promise.resolve(
				new Response(JSON.stringify({ result: 0, access_token: 'tok', locationid: 1 }), {
					status: 200,
				}),
			)
		})

		await getTokenFromCode('the-code', 'the-client', 'the-secret')

		expect(capturedUrl).toContain('client_id=the-client')
		expect(capturedUrl).toContain('code=the-code')
		expect(capturedUrl).not.toContain('the-secret')
		expect(capturedUrl).not.toContain('client_secret=')

		expect(capturedInit?.method).toBe('POST')
		const body = capturedInit?.body
		expect(body).toBeInstanceOf(URLSearchParams)
		expect((body as URLSearchParams).get('client_secret')).toBe('the-secret')
	})
})
