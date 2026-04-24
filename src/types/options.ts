import type { ProgressCallback } from "./progress";
import type { RemoteUploadProgress } from "./api";

export interface CreateClientOptions {
  token: string;
  type?: "oauth" | "pcloud";
  apiServer?: string;
  useProxy?: boolean;
  coalesceReads?: boolean;
}

export interface CallOptions {
  method?: "GET" | "POST";
  responseType?: "json" | "text" | "stream" | "blob";
  signal?: AbortSignal;
  onProgress?: ProgressCallback;
  body?: BodyInit;
}

export interface UploadOptions {
  onBegin?: () => void;
  onProgress?: ProgressCallback;
  onFinish?: (result: unknown) => void;
}

export interface DownloadOptions {
  onBegin?: () => void;
  onProgress?: ProgressCallback;
  onFinish?: (result: unknown) => void;
}

export interface RemoteUploadOptions {
  onBegin?: () => void;
  onProgress?: (progress: RemoteUploadProgress) => void;
  onFinish?: (result: unknown) => void;
}

export interface ThumbOptions {
  thumbType?: "jpg" | "png" | "auto";
  size?: "32x32" | "120x120";
}

export interface ListFolderOptions {
  recursive?: boolean;
  showdeleted?: boolean;
  nofiles?: boolean;
  noshares?: boolean;
}

export interface RegisterOptions {
  invite?: string;
  ref?: number;
}
