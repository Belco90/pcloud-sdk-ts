import type { ClientContext } from "../client";

export function getfilelink(ctx: ClientContext) {
  return async (fileid: number): Promise<string> => {
    const res = await ctx.call<{ hosts: string[]; path: string }>("getfilelink", { fileid });
    const host = res.hosts[0];
    if (!host) throw new TypeError("getfilelink: no hosts returned");
    return `https://${host}${res.path}`;
  };
}
