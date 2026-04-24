// Node-only. Do not import this module from browser bundles: it handles the
// OAuth app secret, which must never reach client-side code.

import { apiRequest } from './transport/request'
import { assert } from './util/assert'

interface AuthorizeUrlOptions {
	clientId: string
	redirectUri: string
	responseType?: 'token' | 'code'
}

export function buildAuthorizeUrl(options: AuthorizeUrlOptions): string {
	assert(options.clientId, '`clientId` is required')
	assert(options.redirectUri, '`redirectUri` is required')

	const url = new URL('https://my.pcloud.com/oauth2/authorize')
	url.searchParams.set('client_id', options.clientId)
	url.searchParams.set('redirect_uri', options.redirectUri)
	url.searchParams.set('response_type', options.responseType ?? 'token')

	return url.toString()
}

export async function getTokenFromCode(
	code: string,
	clientId: string,
	appSecret: string,
): Promise<{ access_token: string; locationid: number }> {
	if (typeof window !== 'undefined') {
		throw new Error(
			'getTokenFromCode must not be called from a browser — it requires an app secret. Use oauth-browser for the browser flow.',
		)
	}
	assert(code, '`code` is required')
	assert(clientId, '`clientId` is required')
	assert(appSecret, '`appSecret` is required')

	return apiRequest<{ access_token: string; locationid: number }>(
		'eapi.pcloud.com',
		'oauth2_token',
		{
			method: 'POST',
			params: { client_id: clientId, code },
			body: new URLSearchParams({ client_secret: appSecret }),
		},
	)
}
