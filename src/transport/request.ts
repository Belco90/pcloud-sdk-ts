import { PcloudApiError, PcloudNetworkError } from "../errors.js";
import { isReadMethod } from "../constants/methods.js";
import { buildUrl } from "./url.js";
import { coalesce, coalesceKey } from "./coalesce.js";
import { makeProgressStream } from "./progress.js";
import type { CallOptions } from "../types/options.js";

type Primitive = string | number | boolean;

export interface RequestParams {
  params?: Record<string, Primitive | undefined>;
  body?: BodyInit;
  noCoalesce?: boolean;
}

function makeFetchInit(
  verb: string,
  body: BodyInit | undefined,
  signal: AbortSignal | undefined,
): RequestInit {
  const init: RequestInit = { method: verb };
  if (body !== undefined) init.body = body;
  if (signal !== undefined) init.signal = signal;
  return init;
}

async function parseJsonResponse<T>(
  res: Response,
  method: string,
  params: Record<string, string>,
): Promise<T> {
  let json: Record<string, unknown>;
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch (err) {
    throw new PcloudNetworkError(method, "Invalid JSON response", res.status, err);
  }

  const result = json["result"];
  if (typeof result === "number" && result !== 0) {
    throw new PcloudApiError(result, String(json["error"] ?? "Unknown error"), method, params);
  }

  return json as unknown as T;
}

export async function apiRequest<T>(
  apiServer: string,
  method: string,
  options: CallOptions & RequestParams = {},
): Promise<T> {
  const { params, body, signal, onProgress, responseType = "json", noCoalesce = false } = options;
  const verb = options.method ?? (body ? "POST" : "GET");

  const urlParams: Record<string, string> = {};
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) urlParams[k] = String(v);
    }
  }

  const url = buildUrl(apiServer, method, urlParams);
  const init = makeFetchInit(verb, body, signal);

  const run = async (): Promise<T> => {
    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (err) {
      throw new PcloudNetworkError(method, (err as Error).message, undefined, err);
    }

    if (!res.ok) throw new PcloudNetworkError(method, res.statusText, res.status);

    if (responseType === "stream") return res.body as unknown as T;
    if (responseType === "blob") return (await res.blob()) as unknown as T;
    if (responseType === "text") return (await res.text()) as unknown as T;

    return parseJsonResponse<T>(res, method, urlParams);
  };

  const trackingRun = onProgress
    ? async (): Promise<T> => {
        let res: Response;
        try {
          res = await fetch(url, init);
        } catch (err) {
          throw new PcloudNetworkError(method, (err as Error).message, undefined, err);
        }

        if (!res.ok) throw new PcloudNetworkError(method, res.statusText, res.status);

        if ((responseType === "stream" || responseType === "blob") && res.body) {
          const total = res.headers.get("content-length")
            ? Number(res.headers.get("content-length"))
            : undefined;
          const tracked = res.body.pipeThrough(makeProgressStream(onProgress, "download", total));
          if (responseType === "stream") return tracked as unknown as T;
          return (await new Response(tracked).blob()) as unknown as T;
        }

        return parseJsonResponse<T>(res, method, urlParams);
      }
    : null;

  const executor = trackingRun ?? run;

  if (!noCoalesce && verb === "GET" && isReadMethod(method)) {
    return coalesce(coalesceKey(method, urlParams), executor);
  }

  return executor();
}

export async function buildUploadBody(
  source: string | Blob | File,
  fieldName: string,
  filename: string,
): Promise<FormData> {
  let blob: Blob;
  let resolvedName: string;

  if (typeof source === "string") {
    const { openAsBlob } = await import("node:fs");
    const { basename } = await import("node:path");
    blob = await openAsBlob(source);
    resolvedName = filename || basename(source);
  } else {
    blob = source;
    resolvedName = filename || (source instanceof File ? source.name : "upload");
  }

  const form = new FormData();
  form.append(fieldName, blob, resolvedName);
  return form;
}
