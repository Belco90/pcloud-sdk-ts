import { describe, it, expect } from 'vitest'

import { coalesce, coalesceKey } from '../../../src/transport/coalesce'

describe('coalesce', () => {
	it('returns the same promise for concurrent identical keys', async () => {
		let callCount = 0
		const exec = () => {
			callCount++
			return new Promise<string>((resolve) => setTimeout(() => resolve('value'), 10))
		}

		const p1 = coalesce('key-a', exec)
		const p2 = coalesce('key-a', exec)

		const [r1, r2] = await Promise.all([p1, p2])
		expect(r1).toBe('value')
		expect(r2).toBe('value')
		expect(callCount).toBe(1)
	})

	it('allows a second call after the first resolves', async () => {
		let callCount = 0
		const exec = () => Promise.resolve(++callCount)

		await coalesce('key-b', exec)
		const result = await coalesce('key-b', exec)
		expect(result).toBe(2)
		expect(callCount).toBe(2)
	})

	it('different keys get separate calls', async () => {
		let callCount = 0
		const exec = () => Promise.resolve(++callCount)

		const [r1, r2] = await Promise.all([coalesce('key-c1', exec), coalesce('key-c2', exec)])
		expect(callCount).toBe(2)
		expect(r1).not.toBe(r2)
	})
})

describe('coalesceKey', () => {
	it('sorts params alphabetically', () => {
		const k1 = coalesceKey('listfolder', { b: '2', a: '1' })
		const k2 = coalesceKey('listfolder', { a: '1', b: '2' })
		expect(k1).toBe(k2)
	})

	it('includes the method name', () => {
		const k = coalesceKey('listfolder', {})
		expect(k).toContain('listfolder')
	})

	it('produces different keys when scope differs', () => {
		const k1 = coalesceKey('listfolder', { folderid: '0' }, 'client-a')
		const k2 = coalesceKey('listfolder', { folderid: '0' }, 'client-b')
		expect(k1).not.toBe(k2)
	})

	it('produces the same key for the same scope and params', () => {
		const k1 = coalesceKey('listfolder', { folderid: '0' }, 'client-a')
		const k2 = coalesceKey('listfolder', { folderid: '0' }, 'client-a')
		expect(k1).toBe(k2)
	})
})
