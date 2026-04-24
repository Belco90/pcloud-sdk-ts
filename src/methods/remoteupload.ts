import type { ClientContext } from "../client";
import type { FileMetadata, RemoteUploadProgress } from "../types/api";
import type { RemoteUploadOptions } from "../types/options";
import { assert } from "../util/assert";

export function remoteupload(ctx: ClientContext) {
  return async (
    url: string,
    folderid: number = 0,
    options: RemoteUploadOptions = {},
  ): Promise<{ metadata: FileMetadata }> => {
    assert(url && typeof url === "string", "`url` is required");

    options.onBegin?.();

    const progresshash = `pcloud-sdk-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    let stopPoll = false;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;

    const poll = () => {
      if (stopPoll) return;
      ctx
        .call<RemoteUploadProgress & { finished?: boolean }>("uploadprogress", { progresshash })
        .then((res) => {
          options.onProgress?.(res);
          if (!res.finished && !stopPoll) {
            pollTimer = setTimeout(poll, 200);
          }
        })
        .catch(() => {});
    };

    if (options.onProgress) poll();

    try {
      const server = await ctx.call<{ hostname: string }>("currentserver");
      const res = await ctx.call<{ metadata: FileMetadata[] }>(
        "downloadfile",
        {
          folderid,
          progresshash,
          nopartial: 1,
          url,
          apiServer: server.hostname,
        },
        { method: "POST" },
      );

      stopPoll = true;
      if (pollTimer !== undefined) clearTimeout(pollTimer);

      const metadata = res.metadata[0];
      if (!metadata) throw new TypeError("remoteupload: no metadata in response");

      const result = { metadata };
      options.onFinish?.(result);
      return result;
    } catch (err) {
      stopPoll = true;
      if (pollTimer !== undefined) clearTimeout(pollTimer);
      throw err;
    }
  };
}
