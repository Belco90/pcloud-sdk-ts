import { describe, it, expect, vi } from 'vitest'

import { createClient } from '../../../src/client'
import { apiOk, mockFetch } from '../../fixtures/responses'

const THUMB_RESPONSE = { hosts: ['p-host.pcloud.com'], path: '/cBL12345/thumb.jpg' }

describe('getthumblink', () => {
	it('returns assembled https URL', async () => {
		vi.stubGlobal('fetch', mockFetch(apiOk(THUMB_RESPONSE)))
		const client = createClient({ token: 'test-token' })
		const url = await client.getthumblink(42)
		expect(url).toBe('https://p-host.pcloud.com/cBL12345/thumb.jpg')
	})

	it('sends fileid, type=auto, size=120x120, crop=1 by default', async () => {
		let capturedUrl = ''
		vi.stubGlobal('fetch', (url: string) => {
			capturedUrl = url
			return Promise.resolve(new Response(JSON.stringify(apiOk(THUMB_RESPONSE)), { status: 200 }))
		})

		const client = createClient({ token: 'test-token' })
		await client.getthumblink(42)
		expect(capturedUrl).toContain('fileid=42')
		expect(capturedUrl).toContain('type=auto')
		expect(capturedUrl).toContain('size=120x120')
		expect(capturedUrl).toContain('crop=1')
	})

	it('honors custom thumbType, size, and crop=false', async () => {
		let capturedUrl = ''
		vi.stubGlobal('fetch', (url: string) => {
			capturedUrl = url
			return Promise.resolve(new Response(JSON.stringify(apiOk(THUMB_RESPONSE)), { status: 200 }))
		})

		const client = createClient({ token: 'test-token' })
		await client.getthumblink(42, { thumbType: 'png', size: '32x32', crop: false })
		expect(capturedUrl).toContain('type=png')
		expect(capturedUrl).toContain('size=32x32')
		expect(capturedUrl).toContain('crop=0')
	})

	it('throws TypeError when hosts array is empty', async () => {
		vi.stubGlobal('fetch', mockFetch(apiOk({ hosts: [], path: '/cBL12345/thumb.jpg' })))
		const client = createClient({ token: 'test-token' })
		await expect(client.getthumblink(42)).rejects.toThrow(TypeError)
		await expect(client.getthumblink(42)).rejects.toThrow('getthumblink: no hosts returned')
	})
})
