import type { ClientContext } from '../client'
import type { FileMetadata } from '../types/api'

export function renamefile(ctx: ClientContext) {
	return async (fileid: number, toname: string): Promise<FileMetadata> => {
		const res = await ctx.call<{ metadata: FileMetadata }>('renamefile', { fileid, toname })
		return res.metadata
	}
}
