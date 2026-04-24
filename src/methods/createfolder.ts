import type { ClientContext } from "../client";
import type { FolderMetadata } from "../types/api";

export function createfolder(ctx: ClientContext) {
  return async (name: string, parentfolderid: number = 0): Promise<FolderMetadata> => {
    const res = await ctx.call<{ metadata: FolderMetadata }>("createfolder", {
      name,
      folderid: parentfolderid,
    });
    return res.metadata;
  };
}
