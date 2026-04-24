import type { ClientContext } from "../client.js";
import type { UserInfo } from "../types/api.js";

export function userinfo(ctx: ClientContext) {
  return async (): Promise<UserInfo> => {
    const res = await ctx.call<{ result: 0 } & UserInfo>("userinfo");
    return res;
  };
}
