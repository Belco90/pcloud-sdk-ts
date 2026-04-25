import { http, HttpResponse } from 'msw'

import { APP_SECRET, CLIENT_ID, CODE, FOLDER, OAUTH_TOKEN, PCLOUD_TOKEN, USER } from './fixtures'

export interface MakeHandlersOptions {
	/** Hosts to register handlers against. Defaults to both pCloud API hosts
	 * because `initOauthPollToken` polls eapi and api in parallel. */
	apiHosts?: string[]
}

const DEFAULT_API_HOSTS = ['https://eapi.pcloud.com', 'https://api.pcloud.com']

function authError() {
	return HttpResponse.json({ result: 1000, error: 'Log in required' })
}

function detectAuth(url: URL): 'oauth' | 'pcloud' | null {
	const accessToken = url.searchParams.get('access_token')
	const auth = url.searchParams.get('auth')
	if (accessToken === OAUTH_TOKEN) return 'oauth'
	if (auth === PCLOUD_TOKEN) return 'pcloud'
	return null
}

export function makeHandlers(options: MakeHandlersOptions = {}) {
	const apiHosts = options.apiHosts ?? DEFAULT_API_HOSTS

	return apiHosts.flatMap((apiHost) => [
		http.get(`${apiHost}/listfolder`, ({ request }) => {
			const url = new URL(request.url)
			if (detectAuth(url) === null) return authError()
			return HttpResponse.json({ result: 0, metadata: FOLDER })
		}),

		http.get(`${apiHost}/userinfo`, ({ request }) => {
			const url = new URL(request.url)
			if (detectAuth(url) === null) return authError()
			return HttpResponse.json({ result: 0, ...USER })
		}),

		// OAuth code exchange — POST with `client_secret` in the URLSearchParams body.
		http.post(`${apiHost}/oauth2_token`, async ({ request }) => {
			const url = new URL(request.url)
			const clientId = url.searchParams.get('client_id')
			const code = url.searchParams.get('code')
			const bodyText = await request.text()
			const bodyParams = new URLSearchParams(bodyText)
			const clientSecret = bodyParams.get('client_secret')

			if (clientId !== CLIENT_ID || code !== CODE || clientSecret !== APP_SECRET) {
				return HttpResponse.json({ result: 2000, error: 'Invalid client credentials' })
			}
			return HttpResponse.json({ result: 0, access_token: OAUTH_TOKEN, locationid: 1 })
		}),

		// GET /oauth2_token serves two flows:
		//  - poll-token (browser): `client_id` + `request_id`
		//  - legacy code exchange: `client_id` + `code` + `client_secret` in query
		// Branch on the params present in the request.
		http.get(`${apiHost}/oauth2_token`, ({ request }) => {
			const url = new URL(request.url)
			const clientId = url.searchParams.get('client_id')
			const requestId = url.searchParams.get('request_id')
			const code = url.searchParams.get('code')
			const clientSecret = url.searchParams.get('client_secret')

			if (clientId !== CLIENT_ID) {
				return HttpResponse.json({ result: 2000, error: 'Invalid request' })
			}
			if (requestId) {
				return HttpResponse.json({ result: 0, access_token: OAUTH_TOKEN, locationid: 1 })
			}
			if (code === CODE && clientSecret === APP_SECRET) {
				return HttpResponse.json({ result: 0, access_token: OAUTH_TOKEN, locationid: 1 })
			}
			return HttpResponse.json({ result: 2000, error: 'Invalid client credentials' })
		}),
	])
}

/**
 * Override that flips `listfolder` to a pCloud API error. Use via
 * `server.use(...errorHandlers())` inside an error-path test.
 */
export function errorHandlers(options: MakeHandlersOptions = {}) {
	const apiHosts = options.apiHosts ?? DEFAULT_API_HOSTS
	return apiHosts.map((apiHost) =>
		http.get(`${apiHost}/listfolder`, () =>
			HttpResponse.json({ result: 2005, error: 'Directory does not exist' }),
		),
	)
}
