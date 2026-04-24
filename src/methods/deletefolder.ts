import type { ClientContext } from "../client.js";
import type { FolderMetadata } from "../types/api.js";

export function deletefolder(ctx: ClientContext) {
  return async (folderid: number, recursive?: boolean): Promise<FolderMetadata> => {
    const apiMethod = recursive ? "deletefolderrecursive" : "deletefolder";
    const res = await ctx.call<{ metadata: FolderMetadata }>(apiMethod, { folderid });
    return res.metadata;
  };
}
