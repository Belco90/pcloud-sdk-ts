import type { CallOptions } from '../types/options'

import { isReadMethod } from '../constants/methods'
import { PcloudApiError, PcloudNetworkError } from '../errors'
import { sanitizeUrlString } from '../util/sanitize'
import { coalesce, coalesceKey } from './coalesce'
import { makeProgressStream } from './progress'
import { buildUrl } from './url'

type Primitive = string | number | boolean

export type AuthEntry = ['access_token' | 'auth', string]

export interface RequestParams {
	params?: Record<string, Primitive | undefined>
	auth?: AuthEntry
	body?: BodyInit
	noCoalesce?: boolean
	coalesceScope?: string
}

function makeFetchInit(
	verb: string,
	body: BodyInit | undefined,
	signal: AbortSignal | undefined,
): RequestInit {
	const init: RequestInit = { method: verb }
	if (body !== undefined) init.body = body
	if (signal !== undefined) init.signal = signal
	return init
}

function wrapFetchError(method: string, err: unknown): PcloudNetworkError {
	// The original fetch error can embed the request URL (with the auth token
	// as a query param) in its message — undici does this for TLS/connection
	// failures. We deliberately replace `cause` with a sanitized copy instead
	// of forwarding the raw error; preserve-caught-error does not apply.
	const inner = err instanceof Error ? err : new Error(String(err))
	const safeMessage = sanitizeUrlString(inner.message)
	const safeCause = { name: inner.name, message: safeMessage }
	return new PcloudNetworkError(method, safeMessage, undefined, safeCause)
}

async function parseJsonResponse<T>(
	res: Response,
	method: string,
	params: Record<string, string>,
): Promise<T> {
	let json: Record<string, unknown>
	try {
		json = (await res.json()) as Record<string, unknown>
	} catch (err) {
		throw new PcloudNetworkError(method, 'Invalid JSON response', res.status, err)
	}

	const result = json['result']
	if (typeof result === 'number' && result !== 0) {
		throw new PcloudApiError(result, String(json['error'] ?? 'Unknown error'), method, params)
	}

	return json as unknown as T
}

export async function apiRequest<T>(
	apiServer: string,
	method: string,
	options: CallOptions & RequestParams = {},
): Promise<T> {
	const {
		params,
		auth,
		body,
		signal,
		onProgress,
		responseType = 'json',
		noCoalesce = false,
		coalesceScope,
	} = options
	const verb = options.method ?? (body ? 'POST' : 'GET')

	const urlParams: Record<string, string> = {}
	if (params) {
		for (const [k, v] of Object.entries(params)) {
			if (v !== undefined) urlParams[k] = String(v)
		}
	}

	const urlParamsWithAuth = auth ? { ...urlParams, [auth[0]]: auth[1] } : urlParams
	const url = buildUrl(apiServer, method, urlParamsWithAuth)
	const init = makeFetchInit(verb, body, signal)

	const run = async (): Promise<T> => {
		let res: Response
		try {
			res = await fetch(url, init)
		} catch (err) {
			throw wrapFetchError(method, err)
		}

		if (!res.ok) throw new PcloudNetworkError(method, res.statusText, res.status)

		if (responseType === 'stream') return res.body as unknown as T
		if (responseType === 'blob') return (await res.blob()) as unknown as T
		if (responseType === 'text') return (await res.text()) as unknown as T

		return parseJsonResponse<T>(res, method, urlParams)
	}

	const trackingRun = onProgress
		? async (): Promise<T> => {
				let res: Response
				try {
					res = await fetch(url, init)
				} catch (err) {
					throw wrapFetchError(method, err)
				}

				if (!res.ok) throw new PcloudNetworkError(method, res.statusText, res.status)

				if ((responseType === 'stream' || responseType === 'blob') && res.body) {
					const total = res.headers.get('content-length')
						? Number(res.headers.get('content-length'))
						: undefined
					const tracked = res.body.pipeThrough(makeProgressStream(onProgress, 'download', total))
					if (responseType === 'stream') return tracked as unknown as T
					return (await new Response(tracked).blob()) as unknown as T
				}

				return parseJsonResponse<T>(res, method, urlParams)
			}
		: null

	const executor = trackingRun ?? run

	if (!noCoalesce && verb === 'GET' && isReadMethod(method)) {
		return coalesce(coalesceKey(method, urlParams, coalesceScope), executor)
	}

	return executor()
}

export async function buildUploadBody(
	source: string | Blob | File,
	fieldName: string,
	filename: string,
): Promise<FormData> {
	let blob: Blob
	let resolvedName: string

	if (typeof source === 'string') {
		const { openAsBlob } = await import('node:fs')
		const { basename } = await import('node:path')
		blob = await openAsBlob(source)
		resolvedName = filename || basename(source)
	} else {
		blob = source
		resolvedName = filename || (source instanceof File ? source.name : 'upload')
	}

	const form = new FormData()
	form.append(fieldName, blob, resolvedName)
	return form
}
