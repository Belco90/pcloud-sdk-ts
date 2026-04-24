import type { ClientContext } from "../client.js";
import type { FolderMetadata } from "../types/api.js";

export function renamefolder(ctx: ClientContext) {
  return async (folderid: number, toname: string): Promise<FolderMetadata> => {
    const res = await ctx.call<{ metadata: FolderMetadata }>("renamefolder", { folderid, toname });
    return res.metadata;
  };
}
