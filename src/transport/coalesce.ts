const inflight = new Map<string, Promise<unknown>>()

export function coalesce<T>(key: string, exec: () => Promise<T>): Promise<T> {
	const existing = inflight.get(key) as Promise<T> | undefined
	if (existing) return existing

	const p = exec().finally(() => inflight.delete(key))
	inflight.set(key, p as Promise<unknown>)
	return p
}

export function coalesceKey(method: string, params: Record<string, string>): string {
	const sorted = Object.entries(params)
		.toSorted(([a], [b]) => a.localeCompare(b))
		.map(([k, v]) => `${k}=${v}`)
		.join('&')
	return `${method}?${sorted}`
}
