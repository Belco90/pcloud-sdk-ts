import type { DownloadOptions } from '../types/options'

import { makeProgressStream } from '../transport/progress'
import { sanitizeUrlString } from '../util/sanitize'

export function download() {
	return async (
		url: string,
		options: DownloadOptions = {},
	): Promise<ReadableStream<Uint8Array>> => {
		options.onBegin?.()

		let res: Response
		try {
			res = await fetch(url)
		} catch (err) {
			// Scrub tokens that undici may have embedded in the fetch error message;
			// cause is replaced with a sanitized wrapper by design.
			const inner = err instanceof Error ? err : new Error(String(err))
			const safeMessage = sanitizeUrlString(inner.message)
			// oxlint-disable-next-line eslint/preserve-caught-error
			throw new TypeError(`download: fetch failed — ${safeMessage}`, {
				cause: { name: inner.name, message: safeMessage },
			})
		}

		if (!res.ok || !res.body) {
			throw new TypeError(`download: HTTP ${res.status} ${res.statusText}`)
		}

		const total = res.headers.get('content-length')
			? Number(res.headers.get('content-length'))
			: undefined

		return options.onProgress
			? res.body.pipeThrough(makeProgressStream(options.onProgress, 'download', total))
			: res.body
	}
}
