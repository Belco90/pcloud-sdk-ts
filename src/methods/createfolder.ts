import type { ClientContext } from "../client.js";
import type { FolderMetadata } from "../types/api.js";

export function createfolder(ctx: ClientContext) {
  return async (name: string, parentfolderid: number = 0): Promise<FolderMetadata> => {
    const res = await ctx.call<{ metadata: FolderMetadata }>("createfolder", {
      name,
      folderid: parentfolderid,
    });
    return res.metadata;
  };
}
