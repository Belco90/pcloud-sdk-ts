# pcloud-sdk

Unofficial, zero-dependency, type-safe pCloud SDK for modern JavaScript runtimes.

A modern alternative to [`pcloud-sdk-js`](https://www.npmjs.com/package/pcloud-sdk-js) with full TypeScript support, and no runtime dependencies.

## Why

|                | `pcloud-sdk-js`                              | `pcloud-sdk`                                  |
| -------------- | -------------------------------------------- | --------------------------------------------- |
| Runtime deps   | `isomorphic-fetch`, `form-data`, `invariant` | none                                          |
| TypeScript     | untyped JS                                   | strict, `exactOptionalPropertyTypes`          |
| Module format  | CJS                                          | ESM only, `sideEffects: false`                |
| Progress       | XHR events                                   | stream-based byte counts                      |
| Errors         | raw rejected JSON                            | typed `PcloudApiError` / `PcloudNetworkError` |
| API style      | callback or promise                          | promise only                                  |
| Environments   | Node + browser                               | Node + browser (platform-neutral build)       |
| EU/US failover | manual                                       | automatic on 5xx                              |

## Requirements

- **Node** `>=22.18.0` — relies on global `fetch`, `Writable.toWeb`, `openAsBlob`, `Array.prototype.toSorted`
- **Browser** — any modern browser with `fetch`, `FormData`, and `ReadableStream`

## Install

```bash
npm install pcloud-sdk
# pnpm add pcloud-sdk / yarn add pcloud-sdk / bun add pcloud-sdk
```

## Quick start

```ts
import { createClient } from 'pcloud-sdk'

const client = createClient({ token: process.env.PCLOUD_TOKEN! })

const root = await client.listfolder(0)
for (const entry of root.contents ?? []) {
	// TypeScript narrows entry to FolderMetadata | FileMetadata via isfolder
	console.log(entry.isfolder ? '[dir]' : '[file]', entry.name)
}
```

## Authentication

### OAuth — server-side code flow (Node)

```ts
import { buildAuthorizeUrl, getTokenFromCode } from 'pcloud-sdk/oauth'

// Step 1: redirect the user to pCloud's consent screen
const url = buildAuthorizeUrl({
	clientId: process.env.PCLOUD_CLIENT_ID!,
	redirectUri: 'https://example.com/callback',
	responseType: 'code',
})

// Step 2: in your callback handler, exchange the code for an access token
const { access_token, locationid } = await getTokenFromCode(
	code,
	process.env.PCLOUD_CLIENT_ID!,
	process.env.PCLOUD_APP_SECRET!,
)

const client = createClient({ token: access_token })
```

### OAuth — browser popup flow

```ts
import { initOauthToken, popup } from 'pcloud-sdk/oauth-browser'

// On the main page: opens a popup and wires the callback
initOauthToken({
	clientId: 'YOUR_CLIENT_ID',
	redirectUri: 'https://example.com/oauth-callback',
	receiveToken: (token, locationid) => {
		const client = createClient({ token })
	},
})

// On the redirectUri page: reads the token from the URL and passes it back
popup()
```

For environments where a redirect URI is impractical, `initOauthPollToken` uses the `poll_token` response type and simultaneously polls both EU and US servers:

```ts
import { initOauthPollToken } from 'pcloud-sdk/oauth-browser'

initOauthPollToken({
	clientId: 'YOUR_CLIENT_ID',
	receiveToken: (token, locationid) => {
		/* … */
	},
	onError: (err) => {
		/* … */
	},
})
```

### Username/password session token

If you have a session token from `userinfo` (the `auth` field), use `type: 'pcloud'` — this switches the auth header from `access_token=` to `auth=`:

```ts
const client = createClient({ token: sessionToken, type: 'pcloud' })
```

`type` defaults to `'oauth'`.

## Convenience methods

These are fully typed and bound directly on the client:

| Method             | Signature                                                                                        | Returns                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `userinfo`         | `()`                                                                                             | `Promise<UserInfo>`                                         |
| `listfolder`       | `(folderid?: number, options?: ListFolderOptions)`                                               | `Promise<FolderMetadata>`                                   |
| `createfolder`     | `(name: string, parentfolderid?: number)`                                                        | `Promise<FolderMetadata>`                                   |
| `deletefile`       | `(fileid: number)`                                                                               | `Promise<FileMetadata>`                                     |
| `deletefolder`     | `(folderid: number, recursive?: boolean)`                                                        | `Promise<FolderMetadata>`                                   |
| `movefile`         | `(fileid: number, tofolderid: number)`                                                           | `Promise<FileMetadata>`                                     |
| `movefolder`       | `(folderid: number, tofolderid: number)`                                                         | `Promise<FolderMetadata>`                                   |
| `renamefile`       | `(fileid: number, toname: string)`                                                               | `Promise<FileMetadata>`                                     |
| `renamefolder`     | `(folderid: number, toname: string)`                                                             | `Promise<FolderMetadata>`                                   |
| `getfilelink`      | `(fileid: number)`                                                                               | `Promise<string>`                                           |
| `sharefolder`      | `(folderid: number, mail: string, permissions: 'view' \| 'edit', message?: string)`              | `Promise<ShareInfo>`                                        |
| `appshare`         | `(folderid: number, userid: number, clientid: string)`                                           | `Promise<AppShareInfo>`                                     |
| `login`            | `(params?: Record<string, string>)`                                                              | `Promise<UserInfo>`                                         |
| `register`         | `(email: string, password: string, options?: RegisterOptions)`                                   | `Promise<number>`                                           |
| `upload`           | `(source: string \| Blob \| File, folderid?: number, options?: UploadOptions)`                   | `Promise<{ metadata: FileMetadata; checksums: Checksums }>` |
| `download`         | `(url: string, options?: DownloadOptions)`                                                       | `Promise<ReadableStream<Uint8Array>>`                       |
| `downloadfile`     | `(fileid: number, destination: string \| WritableStream<Uint8Array>, options?: DownloadOptions)` | `Promise<FileLocal>`                                        |
| `remoteupload`     | `(url: string, folderid?: number, options?: RemoteUploadOptions)`                                | `Promise<{ metadata: FileMetadata }>`                       |
| `getthumbsfileids` | `(fileids: number[], receiveThumb: (thumb: ThumbResult) => void, options?: ThumbOptions)`        | `Promise<ThumbResult[]>`                                    |

## Uploads

```ts
// From a Blob or File (browser or Node)
const { metadata, checksums } = await client.upload(new Blob(['hello']), folderId, {
	onBegin: () => console.log('starting'),
	onProgress: ({ loaded, total }) => console.log(loaded, '/', total),
	onFinish: () => console.log('done'),
})

// From a filesystem path (Node only)
await client.upload('/path/to/video.mp4', folderId)

// Remote URL — pCloud fetches it server-side, progress is polled automatically
await client.remoteupload('https://example.com/archive.zip', folderId, {
	onProgress: ({ all }) => console.log(all.downloaded, '/', all.size),
})
```

Chunked/resumable upload primitives (`upload_create`, `upload_write`, `upload_save`) are available via `client.call()` — there is no high-level wrapper yet.

## Downloads and streaming

```ts
// Download a file to disk (Node)
const { path, bytes } = await client.downloadfile(fileId, '/tmp/out.bin')

// Download to any WritableStream (browser or Node)
await client.downloadfile(fileId, writableStream, {
	onProgress: ({ loaded, total }) => {
		/* … */
	},
})

// Get a raw ReadableStream to pipe or consume yourself
const url = await client.getfilelink(fileId)
const stream = await client.download(url)
```

## Error handling

```ts
import { PcloudApiError, PcloudNetworkError } from 'pcloud-sdk'

try {
	await client.listfolder(0)
} catch (err) {
	if (err instanceof PcloudApiError) {
		// pCloud returned a non-zero result code.
		// `err.params` echoes the method's input params with secret keys
		// (access_token, auth, client_secret, password) stripped, so it's safe to log.
		console.error(err.result, err.method, err.params)
	} else if (err instanceof PcloudNetworkError) {
		// fetch itself failed (timeout, DNS, etc.). The underlying fetch URL
		// may include the auth token as a query param, so `err.message` and
		// `err.cause.message` are scrubbed: values of known secret keys are
		// replaced with `***`. `err.cause` is a plain `{ name, message }`
		// object (not the raw fetch error) to prevent incidental leaks.
		console.error(err.status, err.cause)
	}
}
```

The error classes can also be imported from `pcloud-sdk/errors` to avoid pulling in the full client.

## Low-level `client.call()` — 160+ endpoints

The convenience methods cover the most common operations. For everything else, `call()` is constrained to the `PcloudMethodName` literal union:

```ts
// Typed against ~160 known pCloud method names
const stat = await client.call<{ metadata: FileMetadata }>('stat', { fileid: 12345 })

// Escape hatch for unlisted or future methods
const res = await client.callRaw('some_new_method', { param: 'value' })
```

`call()` also accepts an `AbortSignal`:

```ts
const controller = new AbortController()
await client.call('stat', { fileid: 12345 }, { signal: controller.signal })
```

See the [pCloud HTTP API docs](https://docs.pcloud.com/) for the full method list and parameters.

## Advanced client options

```ts
const client = createClient({
	token,
	type: 'oauth', // 'oauth' (default) | 'pcloud'
	apiServer: 'eapi.pcloud.com', // default EU server; 'api.pcloud.com' for US
	useProxy: true, // auto-detect nearest server via getapiserver on init
	coalesceReads: false, // disable in-flight deduplication of identical GET reads
})

// Swap the token on an existing client (e.g. after token refresh)
client.setToken(newToken)

// Re-detect the nearest server
const server = await client.setupProxy()
```

The client automatically falls back from the EU to the US server (`api.pcloud.com`) on a 5xx or connection failure — no configuration needed.

## Migrating from `pcloud-sdk-js`

### Client creation

```ts
// Before
import pCloudSdk from 'pcloud-sdk-js'
const client = pCloudSdk.createClient(token)

// After
import { createClient } from 'pcloud-sdk'
const client = createClient({ token })
```

### Listing a folder

The method name and promise shape are identical. You now get discriminated union types for free:

```ts
const folder = await client.listfolder(0, { recursive: true })

for (const entry of folder.contents ?? []) {
	if (entry.isfolder) {
		entry.folderid // FolderMetadata — TypeScript knows this
	} else {
		entry.fileid // FileMetadata — TypeScript knows this
	}
}
```

### Upload progress

```ts
// Before — XHR ProgressEvent
client.upload(file, folderId, { onProgress: (event) => event.loaded / event.total })

// After — stream-based byte counts
client.upload(file, folderId, {
	onProgress: ({ loaded, total }) => loaded / (total ?? Infinity),
})
```

### Error handling

```ts
// Before — raw rejected JSON
.catch((err) => {
  if (err.result === 2000) { /* invalid token */ }
})

// After — typed error classes
.catch((err) => {
  if (err instanceof PcloudApiError && err.result === 2000) { /* invalid token */ }
})
```

### Gaps

- **Chunked/resumable uploads** — no high-level wrapper; use `client.call('upload_create', …)` etc. directly.
- **Upload progress on file paths (Node)** — progress reflects bytes passing through the stream tee, not HTTP body-upload confirmation events.

## Development

```bash
pnpm install
pnpm test       # vitest
pnpm build      # tsdown (ESM + .d.ts)
```

The project uses tsdown for bundling, vitest for testing, oxlint for linting, and oxfmt for formatting.

## License

MIT
