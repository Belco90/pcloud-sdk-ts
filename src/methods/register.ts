import type { ClientContext } from '../client'
import type { RegisterOptions } from '../types/options'

export function register(ctx: ClientContext) {
	return async (
		email: string,
		password: string,
		options: RegisterOptions = {},
	): Promise<number> => {
		const res = await ctx.call<{ userid: number }>('register', {
			username: email,
			password,
			termsaccepted: 'yes',
			...options,
		})
		return res.userid
	}
}
