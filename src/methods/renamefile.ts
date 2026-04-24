import type { ClientContext } from "../client.js";
import type { FileMetadata } from "../types/api.js";

export function renamefile(ctx: ClientContext) {
  return async (fileid: number, toname: string): Promise<FileMetadata> => {
    const res = await ctx.call<{ metadata: FileMetadata }>("renamefile", { fileid, toname });
    return res.metadata;
  };
}
