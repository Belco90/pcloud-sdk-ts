export { createClient } from "./client";
export { PcloudApiError, PcloudNetworkError } from "./errors";

export type { Client, ClientContext } from "./client";
export type { PcloudMethodName } from "./constants/methods";
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
} from "./types/api";
export type {
  ListFolderOptions,
  UploadOptions,
  DownloadOptions,
  RemoteUploadOptions,
  ThumbOptions,
  RegisterOptions,
  CallOptions,
} from "./types/options";
export type { Progress, ProgressCallback } from "./types/progress";
