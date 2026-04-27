import { describe, it, expect, vi } from 'vitest'

import { createClient } from '../../../src/client'

describe('getthumbsfileids', () => {
	it('sends crop=1 by default', async () => {
		let capturedUrl = ''
		vi.stubGlobal('fetch', (url: string) => {
			capturedUrl = url
			return Promise.resolve(new Response('', { status: 200 }))
		})

		const client = createClient({ token: 'test-token' })
		await client.getthumbsfileids([42], () => {})
		expect(capturedUrl).toContain('crop=1')
	})

	it('sends crop=0 when options.crop is false', async () => {
		let capturedUrl = ''
		vi.stubGlobal('fetch', (url: string) => {
			capturedUrl = url
			return Promise.resolve(new Response('', { status: 200 }))
		})

		const client = createClient({ token: 'test-token' })
		await client.getthumbsfileids([42], () => {}, { crop: false })
		expect(capturedUrl).toContain('crop=0')
	})
})
