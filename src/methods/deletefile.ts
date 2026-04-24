import type { ClientContext } from "../client";
import type { FileMetadata } from "../types/api";

export function deletefile(ctx: ClientContext) {
  return async (fileid: number): Promise<FileMetadata> => {
    const res = await ctx.call<{ metadata: FileMetadata }>("deletefile", { fileid });
    return res.metadata;
  };
}
