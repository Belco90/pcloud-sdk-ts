import type { ClientContext } from '../client'
import type { AppShareInfo } from '../types/api'

export function appshare(ctx: ClientContext) {
	return async (folderid: number, userid: number, clientid: string): Promise<AppShareInfo> => {
		const res = await ctx.call<AppShareInfo>('getfolderpublink', { folderid, userid, clientid })
		return res
	}
}
