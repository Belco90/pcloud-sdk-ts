import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

type MessageListener = (event: MessageEvent) => void

interface FakeWindow {
	open: (url: string, target?: string, features?: string) => FakeWindow
	addEventListener: (type: string, listener: EventListener) => void
	removeEventListener: (type: string, listener: EventListener) => void
	location: { origin: string; hash: string; search: string }
	opener: { postMessage: (msg: unknown, targetOrigin: string) => void } | null
	close: () => void
	_listeners: MessageListener[]
	_lastPopup?: FakeWindow
	_closed?: boolean
	_opened?: Array<{ url: string; target?: string; features?: string }>
}

function makeFakeWindow(origin = 'https://example.com', hash = '', search = ''): FakeWindow {
	const listeners: MessageListener[] = []
	const win: FakeWindow = {
		_listeners: listeners,
		_opened: [],
		location: { origin, hash, search },
		opener: null,
		open(url, target, features) {
			const popup: FakeWindow = {
				...makeFakeWindow(origin),
				_closed: false,
			}
			this._lastPopup = popup
			this._opened?.push({
				...(target !== undefined ? { target } : {}),
				...(features !== undefined ? { features } : {}),
				url,
			})
			return popup
		},
		addEventListener(type, listener) {
			if (type === 'message') listeners.push(listener as MessageListener)
		},
		removeEventListener(type, listener) {
			if (type !== 'message') return
			const idx = listeners.indexOf(listener as MessageListener)
			if (idx >= 0) listeners.splice(idx, 1)
		},
		close() {
			this._closed = true
		},
	}
	return win
}

beforeEach(() => {
	vi.restoreAllMocks()
})

afterEach(() => {
	vi.unstubAllGlobals()
})

describe('initOauthToken', () => {
	it('invokes receiveToken when the popup posts a valid message', async () => {
		const win = makeFakeWindow('https://example.com')
		vi.stubGlobal('window', win)
		vi.stubGlobal('location', win.location)

		const received: Array<[string, string | null]> = []
		const { initOauthToken } = await import('../../src/oauth-browser')
		initOauthToken({
			clientId: 'abc',
			redirectUri: 'https://example.com/cb',
			receiveToken: (token, locationid) => received.push([token, locationid]),
		})

		expect(win._opened).toHaveLength(1)
		expect(win._opened?.[0]?.url).toContain('client_id=abc')

		const popup = win._lastPopup
		const listener = win._listeners[0]
		expect(listener).toBeDefined()

		// wrong source — ignored
		listener?.({
			source: makeFakeWindow(),
			origin: 'https://example.com',
			data: { type: 'pcloud-oauth-token', token: 'x', locationid: null },
		} as unknown as MessageEvent)
		expect(received).toHaveLength(0)

		// wrong origin — ignored
		listener?.({
			source: popup,
			origin: 'https://evil.example',
			data: { type: 'pcloud-oauth-token', token: 'x', locationid: null },
		} as unknown as MessageEvent)
		expect(received).toHaveLength(0)

		// wrong type — ignored
		listener?.({
			source: popup,
			origin: 'https://example.com',
			data: { type: 'other', token: 'x' },
		} as unknown as MessageEvent)
		expect(received).toHaveLength(0)

		// valid — accepted
		listener?.({
			source: popup,
			origin: 'https://example.com',
			data: { type: 'pcloud-oauth-token', token: 'THE-TOKEN', locationid: '1' },
		} as unknown as MessageEvent)
		expect(received).toEqual([['THE-TOKEN', '1']])

		// listener removed after first valid message
		expect(win._listeners).toHaveLength(0)
	})

	it('does not attach any __setPcloudToken global', async () => {
		const win = makeFakeWindow('https://example.com') as FakeWindow & {
			__setPcloudToken?: unknown
		}
		vi.stubGlobal('window', win)
		vi.stubGlobal('location', win.location)

		const { initOauthToken } = await import('../../src/oauth-browser')
		initOauthToken({
			clientId: 'abc',
			redirectUri: 'https://example.com/cb',
			receiveToken: () => {},
		})

		expect(win.__setPcloudToken).toBeUndefined()
	})
})

describe('popup', () => {
	it('posts the token to window.opener with targetOrigin = location.origin', async () => {
		const posts: Array<{ msg: unknown; targetOrigin: string }> = []
		const win = makeFakeWindow('https://example.com', '#access_token=SECRET&locationid=42')
		win.opener = {
			postMessage: (msg, targetOrigin) => {
				posts.push({ msg, targetOrigin })
			},
		}
		vi.stubGlobal('window', win)
		vi.stubGlobal('location', win.location)

		const { popup } = await import('../../src/oauth-browser')
		popup()

		expect(posts).toEqual([
			{
				msg: { type: 'pcloud-oauth-token', token: 'SECRET', locationid: '42' },
				targetOrigin: 'https://example.com',
			},
		])
		expect(win._closed).toBe(true)
	})

	it('decodes URL-encoded token', async () => {
		const posts: Array<{ msg: unknown }> = []
		const win = makeFakeWindow('https://example.com', '#access_token=a%2Bb%3Dc')
		win.opener = {
			postMessage: (msg) => {
				posts.push({ msg })
			},
		}
		vi.stubGlobal('window', win)
		vi.stubGlobal('location', win.location)

		const { popup } = await import('../../src/oauth-browser')
		popup()

		expect(posts).toHaveLength(1)
		const first = posts[0]
		expect(first).toBeDefined()
		const msg = (first as { msg: unknown }).msg as { token: string }
		expect(msg.token).toBe('a+b=c')
	})

	it('does nothing when no token is present', async () => {
		const posts: unknown[] = []
		const win = makeFakeWindow('https://example.com', '', '')
		win.opener = {
			postMessage: (msg) => posts.push(msg),
		}
		vi.stubGlobal('window', win)
		vi.stubGlobal('location', win.location)

		const { popup } = await import('../../src/oauth-browser')
		popup()

		expect(posts).toHaveLength(0)
		expect(win._closed).toBeFalsy()
	})
})

describe('randomString', () => {
	it('uses crypto.getRandomValues and returns the requested length', async () => {
		const { randomString } = await import('../../src/util/random')
		const spy = vi.spyOn(globalThis.crypto, 'getRandomValues')
		const out = randomString(40)
		expect(out).toHaveLength(40)
		expect(spy).toHaveBeenCalledTimes(1)
		expect(/^[A-Za-z0-9]{40}$/.test(out)).toBe(true)
	})

	it('produces different outputs on repeated calls', async () => {
		const { randomString } = await import('../../src/util/random')
		const a = randomString(40)
		const b = randomString(40)
		expect(a).not.toBe(b)
	})
})
