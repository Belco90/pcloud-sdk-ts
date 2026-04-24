import type { ClientContext } from "../client.js";
import type { UserInfo } from "../types/api.js";

export function login(ctx: ClientContext) {
  return async (params: Record<string, string> = {}): Promise<UserInfo> => {
    const res = await ctx.call<{ result: 0 } & UserInfo>("userinfo", params);
    return res;
  };
}
