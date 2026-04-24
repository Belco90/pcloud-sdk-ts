import { describe, it, expect, vi } from 'vitest'

import { createClient } from '../../../src/client'
import { apiOk, mockFetch, FILE } from '../../fixtures/responses'

describe('upload', () => {
	it('returns metadata and checksums', async () => {
		vi.stubGlobal('fetch', mockFetch(apiOk({ metadata: [FILE], checksums: [{ sha1: 'abc123' }] })))
		const client = createClient({ token: 'test-token' })
		const blob = new Blob(['hello world'], { type: 'text/plain' })
		const result = await client.upload(blob, 0)
		expect(result.metadata.fileid).toBe(42)
		expect(result.checksums.sha1).toBe('abc123')
	})

	it('calls onBegin before upload', async () => {
		vi.stubGlobal('fetch', mockFetch(apiOk({ metadata: [FILE], checksums: [{ sha1: 'abc' }] })))
		const client = createClient({ token: 'test-token' })
		const onBegin = vi.fn()
		const blob = new Blob(['test'], { type: 'text/plain' })
		await client.upload(blob, 0, { onBegin })
		expect(onBegin).toHaveBeenCalledOnce()
	})

	it('calls onFinish with result', async () => {
		vi.stubGlobal('fetch', mockFetch(apiOk({ metadata: [FILE], checksums: [{ sha1: 'abc' }] })))
		const client = createClient({ token: 'test-token' })
		const onFinish = vi.fn()
		const blob = new Blob(['test'], { type: 'text/plain' })
		await client.upload(blob, 0, { onFinish })
		expect(onFinish).toHaveBeenCalledOnce()
	})

	it('throws when source is missing', async () => {
		const client = createClient({ token: 'test-token' })
		// @ts-expect-error testing invalid input
		await expect(client.upload(null, 0)).rejects.toThrow()
	})
})
