import type { DownloadOptions } from '../types/options'

import { makeProgressStream } from '../transport/progress'

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
			throw new TypeError(`download: fetch failed — ${(err as Error).message}`, { cause: err })
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
