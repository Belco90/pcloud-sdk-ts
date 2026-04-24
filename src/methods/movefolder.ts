import type { ClientContext } from "../client.js";
import type { FolderMetadata } from "../types/api.js";

export function movefolder(ctx: ClientContext) {
  return async (folderid: number, tofolderid: number): Promise<FolderMetadata> => {
    const res = await ctx.call<{ metadata: FolderMetadata }>("renamefolder", {
      folderid,
      tofolderid,
    });
    return res.metadata;
  };
}
