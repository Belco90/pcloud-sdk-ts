import type { ClientContext } from '../client'
import type { FileLocal } from '../types/api'
import type { DownloadOptions } from '../types/options'

import { makeProgressStream } from '../transport/progress'
import { assert } from '../util/assert'

export function downloadfile(ctx: ClientContext) {
	return async (
		fileid: number,
		destination: string | WritableStream<Uint8Array>,
		options: DownloadOptions = {},
	): Promise<FileLocal> => {
		options.onBegin?.()

		const linkRes = await ctx.call<{ hosts: string[]; path: string }>('getfilelink', { fileid })
		const host = linkRes.hosts[0]
		assert(host !== undefined, 'getfilelink: no hosts returned')
		const url = `https://${host}${linkRes.path}`

		let res: Response
		try {
			res = await fetch(url)
		} catch (err) {
			throw new TypeError(`downloadfile: fetch failed — ${(err as Error).message}`)
		}

		assert(res.ok && res.body !== null, `downloadfile: HTTP ${res.status} ${res.statusText}`)

		const total = res.headers.get('content-length')
			? Number(res.headers.get('content-length'))
			: undefined

		const stream = options.onProgress
			? res.body.pipeThrough(makeProgressStream(options.onProgress, 'download', total))
			: res.body

		if (typeof destination === 'string') {
			const { createWriteStream } = await import('node:fs')
			const { basename } = await import('node:path')
			const { Writable } = await import('node:stream')

			const nodeWritable = createWriteStream(destination)
			const webWritable = Writable.toWeb(nodeWritable) as WritableStream<Uint8Array>

			await stream.pipeTo(webWritable)

			const { statSync } = await import('node:fs')
			const stat = statSync(destination)
			const result: FileLocal = {
				path: destination,
				name: basename(destination),
				bytes: stat.size,
			}
			options.onFinish?.(result)
			return result
		}

		await stream.pipeTo(destination)
		const result: FileLocal = { path: '', name: '', bytes: total ?? 0 }
		options.onFinish?.(result)
		return result
	}
}
