import type { DownloadOptions } from "../types/options.js";
import { makeProgressStream } from "../transport/progress.js";

export function download() {
  return async (
    url: string,
    options: DownloadOptions = {},
  ): Promise<ReadableStream<Uint8Array>> => {
    options.onBegin?.();

    let res: Response;
    try {
      res = await fetch(url);
    } catch (err) {
      throw new TypeError(`download: fetch failed — ${(err as Error).message}`);
    }

    if (!res.ok || !res.body) {
      throw new TypeError(`download: HTTP ${res.status} ${res.statusText}`);
    }

    const total = res.headers.get("content-length")
      ? Number(res.headers.get("content-length"))
      : undefined;

    return options.onProgress
      ? res.body.pipeThrough(makeProgressStream(options.onProgress, "download", total))
      : res.body;
  };
}
