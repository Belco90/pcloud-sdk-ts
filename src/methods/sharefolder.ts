import type { ClientContext } from "../client";
import type { ShareInfo, SharePermissions } from "../types/api";

export function sharefolder(ctx: ClientContext) {
  return async (
    folderid: number,
    mail: string,
    permissions: SharePermissions,
    message?: string,
  ): Promise<ShareInfo> => {
    const res = await ctx.call<ShareInfo>("sharefolder", {
      folderid,
      mail,
      permissions: permissions === "view" ? 0 : 1,
      ...(message ? { message } : {}),
    });
    return res;
  };
}
