const SECRET_KEYS = new Set(['access_token', 'auth', 'client_secret', 'password'])

function stripSecretParams(params: Record<string, unknown>): Record<string, unknown> {
	const safe: Record<string, unknown> = {}
	for (const [k, v] of Object.entries(params)) {
		if (!SECRET_KEYS.has(k)) safe[k] = v
	}
	return safe
}

export class PcloudApiError extends Error {
	readonly result: number
	readonly method: string
	/** Method parameters echoed back for debugging. Known secret keys
	 * (access_token, auth, client_secret, password) are stripped. */
	readonly params?: Readonly<Record<string, unknown>>

	constructor(result: number, message: string, method: string, params?: Record<string, unknown>) {
		super(`pCloud API error on ${method} (${result}): ${message}`)
		this.name = 'PcloudApiError'
		this.result = result
		this.method = method
		if (params !== undefined) this.params = stripSecretParams(params)
	}
}

export class PcloudNetworkError extends Error {
	readonly method: string
	readonly status?: number

	constructor(method: string, message: string, status?: number, cause?: unknown) {
		super(`pCloud network error on ${method}: ${message}`)
		this.name = 'PcloudNetworkError'
		this.method = method
		if (status !== undefined) this.status = status
		if (cause !== undefined) this.cause = cause
	}
}
