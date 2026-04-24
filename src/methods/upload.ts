import type { ClientContext } from "../client";
import type { FileMetadata, Checksums } from "../types/api";
import type { UploadOptions } from "../types/options";
import { assert } from "../util/assert";

export function upload(ctx: ClientContext) {
  return async (
    source: string | Blob | File,
    folderid: number = 0,
    options: UploadOptions = {},
  ): Promise<{ metadata: FileMetadata; checksums: Checksums }> => {
    assert(source !== undefined && source !== null, "`source` is required");

    options.onBegin?.();

    let blob: Blob;
    let filename: string;

    if (typeof source === "string") {
      const { openAsBlob } = await import("node:fs");
      const { basename } = await import("node:path");
      blob = await openAsBlob(source);
      filename = basename(source);
    } else {
      blob = source;
      filename = source instanceof File ? source.name : "upload";
    }

    const form = new FormData();
    form.append("file", blob, filename);

    const callOpts: import("../types/options").CallOptions = {
      method: "POST",
      body: form,
      ...(options.onProgress ? { onProgress: options.onProgress } : {}),
    };

    const res = await ctx.call<{ metadata: FileMetadata[]; checksums: Checksums[] }>(
      "uploadfile",
      { folderid, nopartial: 1 },
      callOpts,
    );

    const metadata = res.metadata[0];
    const checksums = res.checksums[0];

    if (!metadata || !checksums) {
      throw new TypeError("uploadfile: unexpected empty response");
    }

    const result = { metadata, checksums };
    options.onFinish?.(result);
    return result;
  };
}
