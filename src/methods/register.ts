import type { ClientContext } from "../client.js";
import type { RegisterOptions } from "../types/options.js";

export function register(ctx: ClientContext) {
  return async (
    email: string,
    password: string,
    options: RegisterOptions = {},
  ): Promise<number> => {
    const res = await ctx.call<{ userid: number }>("register", {
      username: email,
      password,
      termsaccepted: "yes",
      ...options,
    });
    return res.userid;
  };
}
