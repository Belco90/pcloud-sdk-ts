import type { ClientContext } from '../client'
import type { FolderMetadata } from '../types/api'

export function movefolder(ctx: ClientContext) {
	return async (folderid: number, tofolderid: number): Promise<FolderMetadata> => {
		const res = await ctx.call<{ metadata: FolderMetadata }>('renamefolder', {
			folderid,
			tofolderid,
		})
		return res.metadata
	}
}
