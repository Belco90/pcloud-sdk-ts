import { apiRequest } from './transport/request'
import { assert } from './util/assert'
import { randomString } from './util/random'

interface OAuthTokenOptions {
	clientId: string
	redirectUri: string
	responseType?: 'token' | 'code'
	receiveToken: (token: string, locationid: string | null) => void
}

interface OAuthPollOptions {
	clientId: string
	receiveToken: (token: string, locationid: number) => void
	onError: (err: Error) => void
}

interface PcloudTokenMessage {
	type: 'pcloud-oauth-token'
	token: string
	locationid: string | null
}

function isPcloudTokenMessage(data: unknown): data is PcloudTokenMessage {
	return (
		typeof data === 'object' &&
		data !== null &&
		(data as { type?: unknown }).type === 'pcloud-oauth-token' &&
		typeof (data as { token?: unknown }).token === 'string'
	)
}

function buildAuthorizeUrl(query: Record<string, string>): string {
	const url = new URL('https://my.pcloud.com/oauth2/authorize')
	for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v)
	return url.toString()
}

export function initOauthToken(options: OAuthTokenOptions): void {
	assert(options.clientId, '`clientId` is required')
	assert(options.redirectUri, '`redirectUri` is required')
	assert(options.receiveToken, '`receiveToken` is required')

	const oauthUrl = buildAuthorizeUrl({
		client_id: options.clientId,
		redirect_uri: options.redirectUri,
		response_type: options.responseType ?? 'token',
	})

	const popupRef = window.open(oauthUrl, 'oauth', 'width=680,height=700')
	const expectedOrigin = window.location.origin

	const handler = (event: MessageEvent): void => {
		if (event.source !== popupRef) return
		if (event.origin !== expectedOrigin) return
		if (!isPcloudTokenMessage(event.data)) return

		window.removeEventListener('message', handler)
		options.receiveToken(event.data.token, event.data.locationid)
	}

	window.addEventListener('message', handler)
}

export function initOauthPollToken(options: OAuthPollOptions): void {
	assert(options.clientId, '`clientId` is required')
	assert(options.receiveToken, '`receiveToken` is required')
	assert(options.onError, '`onError` is required')

	const requestId = randomString(40)

	const oauthUrl = buildAuthorizeUrl({
		client_id: options.clientId,
		request_id: requestId,
		response_type: 'poll_token',
	})

	window.open(oauthUrl, '', 'width=680,height=700')

	const pollServer = (server: string): void => {
		void apiRequest<{ access_token: string; locationid: number }>(server, 'oauth2_token', {
			params: { client_id: options.clientId, request_id: requestId },
		})
			.then((res) => options.receiveToken(res.access_token, res.locationid))
			.catch((err: unknown) => options.onError(err instanceof Error ? err : new Error(String(err))))
	}

	pollServer('eapi.pcloud.com')
	pollServer('api.pcloud.com')
}

export function popup(): void {
	const matchToken = location.hash.match(/access_token=([^&]+)/)
	const matchCode = location.search.match(/code=([^&]+)/)
	const locationIdMatch = location.hash.match(/locationid=([^&]+)/)
	const rawToken = matchToken?.[1] ?? matchCode?.[1]
	const token = rawToken ? decodeURIComponent(rawToken) : null
	const locationid = locationIdMatch?.[1] ? decodeURIComponent(locationIdMatch[1]) : null

	if (token && window.opener) {
		const message: PcloudTokenMessage = { type: 'pcloud-oauth-token', token, locationid }
		window.opener.postMessage(message, window.location.origin)
		window.close()
	}
}
