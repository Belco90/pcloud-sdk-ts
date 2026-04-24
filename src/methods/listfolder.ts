import type { ClientContext } from "../client";
import type { FolderMetadata } from "../types/api";
import type { ListFolderOptions } from "../types/options";

export function listfolder(ctx: ClientContext) {
  return async (folderid: number = 0, options: ListFolderOptions = {}): Promise<FolderMetadata> => {
    const res = await ctx.call<{ metadata: FolderMetadata }>("listfolder", {
      folderid,
      ...(options.recursive ? { recursive: 1 } : {}),
      ...(options.showdeleted ? { showdeleted: 1 } : {}),
      ...(options.nofiles ? { nofiles: 1 } : {}),
      ...(options.noshares ? { noshares: 1 } : {}),
    });
    return res.metadata;
  };
}
