import { describe, it, expect } from 'vitest'

import { PcloudApiError, PcloudNetworkError } from '../../src/errors'

describe('PcloudApiError', () => {
	it('is an instance of Error', () => {
		const err = new PcloudApiError(2005, 'File not found', 'getfilelink')
		expect(err).toBeInstanceOf(Error)
		expect(err).toBeInstanceOf(PcloudApiError)
	})

	it('sets name, result, method', () => {
		const err = new PcloudApiError(2005, 'File not found', 'getfilelink', { fileid: '123' })
		expect(err.name).toBe('PcloudApiError')
		expect(err.result).toBe(2005)
		expect(err.method).toBe('getfilelink')
		expect(err.params).toEqual({ fileid: '123' })
	})

	it('includes method and code in message', () => {
		const err = new PcloudApiError(2005, 'File not found', 'getfilelink')
		expect(err.message).toContain('getfilelink')
		expect(err.message).toContain('2005')
	})

	it('omits params when not provided', () => {
		const err = new PcloudApiError(2005, 'File not found', 'getfilelink')
		expect(err.params).toBeUndefined()
	})
})

describe('PcloudNetworkError', () => {
	it('is an instance of Error', () => {
		const err = new PcloudNetworkError('listfolder', 'Network error')
		expect(err).toBeInstanceOf(Error)
		expect(err).toBeInstanceOf(PcloudNetworkError)
	})

	it('sets name, method, status, cause', () => {
		const cause = new Error('underlying')
		const err = new PcloudNetworkError('listfolder', 'timeout', 503, cause)
		expect(err.name).toBe('PcloudNetworkError')
		expect(err.method).toBe('listfolder')
		expect(err.status).toBe(503)
		expect(err.cause).toBe(cause)
	})

	it('omits status/cause when not provided', () => {
		const err = new PcloudNetworkError('listfolder', 'timeout')
		expect(err.status).toBeUndefined()
		expect(err.cause).toBeUndefined()
	})
})
