import type { ClientContext } from '../client'
import type { ThumbResult } from '../types/api'
import type { ThumbOptions } from '../types/options'

import { assert } from '../util/assert'
import { createThumbParser } from '../util/thumbs-parser'

export function getthumbsfileids(ctx: ClientContext) {
	return async (
		fileids: number[],
		receiveThumb: (thumb: ThumbResult) => void,
		options: ThumbOptions = {},
	): Promise<ThumbResult[]> => {
		assert(Array.isArray(fileids) && fileids.length > 0, '`fileids` must be a non-empty array')
		assert(typeof receiveThumb === 'function', '`receiveThumb` must be a function')

		const thumbType = options.thumbType ?? 'auto'
		const size = options.size ?? '32x32'

		const text = await ctx.call<string>(
			'getthumbs',
			{
				fileids: fileids.join(','),
				type: thumbType,
				size,
				crop: 1,
			},
			{ responseType: 'text' },
		)

		const parser = createThumbParser()
		const thumbs = parser(text + '\n')
		thumbs.forEach(receiveThumb)
		return thumbs
	}
}
