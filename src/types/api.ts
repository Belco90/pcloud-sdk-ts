export interface FileMetadata {
  fileid: number;
  parentfolderid: number;
  name: string;
  isfolder: false;
  size: number;
  contenttype: string;
  hash: string;
  category: number;
  id: string;
  isshared: boolean;
  icon: string;
  created: string;
  modified: string;
}

export interface FolderMetadata {
  folderid: number;
  parentfolderid?: number;
  name: string;
  isfolder: true;
  id: string;
  isshared: boolean;
  icon: string;
  created: string;
  modified: string;
  contents?: Array<FolderMetadata | FileMetadata>;
}

export interface UserInfo {
  userid: number;
  email: string;
  emailverified: boolean;
  quota: number;
  usedquota: number;
  language: string;
  premium: boolean;
  premiumexpires?: string;
  business?: boolean;
}

export interface ShareInfo {
  shareid?: number;
  folderid: number;
  mail: string;
}

export interface AppShareInfo {
  sharelink: string;
  code: string;
}

export interface ThumbResult {
  url: string;
  fileid: number;
}

export interface RemoteUploadInfo {
  progresshash: string;
}

export interface RemoteUploadProgress {
  all: { size: number; downloaded: number };
  files: Array<{
    url: string;
    status: string;
    downloaded: number;
    size: number;
  }>;
}

export interface Checksums {
  sha1: string;
  sha256?: string;
  md5?: string;
}

export interface FileLocal {
  path: string;
  name: string;
  bytes: number;
}

export type SharePermissions = "view" | "edit";
