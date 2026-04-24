import type { FolderMetadata, FileMetadata, UserInfo } from "../../src/types/api";

export const FOLDER: FolderMetadata = {
  folderid: 0,
  name: "My pCloud",
  isfolder: true,
  id: "d0",
  isshared: false,
  icon: "folder",
  created: "2020-01-01T00:00:00+00:00",
  modified: "2020-01-01T00:00:00+00:00",
  contents: [],
};

export const FILE: FileMetadata = {
  fileid: 42,
  parentfolderid: 0,
  name: "test.txt",
  isfolder: false,
  size: 100,
  contenttype: "text/plain",
  hash: "abc123",
  category: 0,
  id: "f42",
  isshared: false,
  icon: "file",
  created: "2020-01-01T00:00:00+00:00",
  modified: "2020-01-01T00:00:00+00:00",
};

export const USER: UserInfo = {
  userid: 1,
  email: "test@example.com",
  emailverified: true,
  quota: 10_737_418_240,
  usedquota: 1_073_741_824,
  language: "en",
  premium: false,
};

export function apiOk<T extends object>(data: T): object {
  return { result: 0, ...data };
}

export function apiErr(result: number, error: string): object {
  return { result, error };
}

export function mockFetch(body: object, status = 200): typeof fetch {
  return (() =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    )) as typeof fetch;
}
