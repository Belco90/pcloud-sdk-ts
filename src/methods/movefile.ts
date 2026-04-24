import type { ClientContext } from "../client";
import type { FileMetadata } from "../types/api";

export function movefile(ctx: ClientContext) {
  return async (fileid: number, tofolderid: number): Promise<FileMetadata> => {
    const res = await ctx.call<{ metadata: FileMetadata }>("renamefile", { fileid, tofolderid });
    return res.metadata;
  };
}
