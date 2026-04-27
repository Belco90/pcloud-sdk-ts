import type { ClientContext } from '../client'
import type { ThumbOptions } from '../types/options'

export function getthumblink(ctx: ClientContext) {
	return async (fileid: number, options: ThumbOptions = {}): Promise<string> => {
		const thumbType = options.thumbType ?? 'auto'
		const size = options.size ?? '120x120'
		const crop = options.crop ?? true

		const res = await ctx.call<{ hosts: string[]; path: string }>('getthumblink', {
			fileid,
			type: thumbType,
			size,
			crop: crop ? 1 : 0,
		})
		const host = res.hosts[0]
		if (!host) throw new TypeError('getthumblink: no hosts returned')
		return `https://${host}${res.path}`
	}
}
