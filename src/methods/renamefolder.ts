import type { ClientContext } from "../client";
import type { FolderMetadata } from "../types/api";

export function renamefolder(ctx: ClientContext) {
  return async (folderid: number, toname: string): Promise<FolderMetadata> => {
    const res = await ctx.call<{ metadata: FolderMetadata }>("renamefolder", { folderid, toname });
    return res.metadata;
  };
}
