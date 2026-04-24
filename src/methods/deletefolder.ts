import type { ClientContext } from '../client'
import type { FolderMetadata } from '../types/api'

export function deletefolder(ctx: ClientContext) {
	return async (folderid: number, recursive?: boolean): Promise<FolderMetadata> => {
		const apiMethod = recursive ? 'deletefolderrecursive' : 'deletefolder'
		const res = await ctx.call<{ metadata: FolderMetadata }>(apiMethod, { folderid })
		return res.metadata
	}
}
