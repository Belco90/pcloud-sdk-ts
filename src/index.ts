export { createClient } from "./client.js";
export { PcloudApiError, PcloudNetworkError } from "./errors.js";

export type { Client, ClientContext } from "./client.js";
export type { PcloudMethodName } from "./constants/methods.js";
export type {
  FileMetadata,
  FolderMetadata,
  UserInfo,
  ShareInfo,
  AppShareInfo,
  ThumbResult,
  RemoteUploadProgress,
  Checksums,
  FileLocal,
  SharePermissions,
} from "./types/api.js";
export type {
  ListFolderOptions,
  UploadOptions,
  DownloadOptions,
  RemoteUploadOptions,
  ThumbOptions,
  RegisterOptions,
  CallOptions,
} from "./types/options.js";
export type { Progress, ProgressCallback } from "./types/progress.js";
