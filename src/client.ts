import type { PcloudMethodName } from './constants/methods'
import type {
	AppShareInfo,
	Checksums,
	FileLocal,
	FileMetadata,
	FolderMetadata,
	ShareInfo,
	SharePermissions,
	ThumbResult,
	UserInfo,
} from './types/api'
import type {
	CallOptions,
	CreateClientOptions,
	DownloadOptions,
	ListFolderOptions,
	RegisterOptions,
	RemoteUploadOptions,
	ThumbOptions,
	UploadOptions,
} from './types/options'

import { isAuthMethod } from './constants/methods'
import { DEFAULT_API_SERVER, FALLBACK_API_SERVER } from './constants/servers'
import { PcloudNetworkError } from './errors'
import * as methods from './methods/index'
import { apiRequest, type AuthEntry } from './transport/request'
import { assert } from './util/assert'
import { randomString } from './util/random'

const PCLOUD_HOST_PATTERN = /^[a-z0-9-]+\.pcloud\.com$/

type Primitive = string | number | boolean

export interface ClientContext {
	call<T>(
		method: string,
		params?: Record<string, Primitive | undefined>,
		options?: CallOptions,
	): Promise<T>
}

export interface Client {
	call<T = unknown>(
		method: PcloudMethodName,
		params?: Record<string, Primitive>,
		options?: CallOptions,
	): Promise<T>
	callRaw<T = unknown>(
		method: string,
		params?: Record<string, Primitive>,
		options?: CallOptions,
	): Promise<T>
	setToken(token: string): void
	setupProxy(): Promise<string>

	userinfo(): Promise<UserInfo>
	listfolder(folderid?: number, options?: ListFolderOptions): Promise<FolderMetadata>
	createfolder(name: string, parentfolderid?: number): Promise<FolderMetadata>
	deletefile(fileid: number): Promise<FileMetadata>
	deletefolder(folderid: number, recursive?: boolean): Promise<FolderMetadata>
	movefile(fileid: number, tofolderid: number): Promise<FileMetadata>
	movefolder(folderid: number, tofolderid: number): Promise<FolderMetadata>
	renamefile(fileid: number, toname: string): Promise<FileMetadata>
	renamefolder(folderid: number, toname: string): Promise<FolderMetadata>
	getfilelink(fileid: number): Promise<string>
	getthumblink(fileid: number, options?: ThumbOptions): Promise<string>
	sharefolder(
		folderid: number,
		mail: string,
		permissions: SharePermissions,
		message?: string,
	): Promise<ShareInfo>
	appshare(folderid: number, userid: number, clientid: string): Promise<AppShareInfo>
	login(params?: Record<string, string>): Promise<UserInfo>
	register(email: string, password: string, options?: RegisterOptions): Promise<number>
	remoteupload(
		url: string,
		folderid?: number,
		options?: RemoteUploadOptions,
	): Promise<{ metadata: FileMetadata }>
	upload(
		source: string | Blob | File,
		folderid?: number,
		options?: UploadOptions,
	): Promise<{ metadata: FileMetadata; checksums: Checksums }>
	download(url: string, options?: DownloadOptions): Promise<ReadableStream<Uint8Array>>
	downloadfile(
		fileid: number,
		destination: string | WritableStream<Uint8Array>,
		options?: DownloadOptions,
	): Promise<FileLocal>
	getthumbsfileids(
		fileids: number[],
		receiveThumb: (thumb: ThumbResult) => void,
		options?: ThumbOptions,
	): Promise<ThumbResult[]>
}

export function createClient(opts: CreateClientOptions): Client {
	assert(typeof opts.token === 'string' && opts.token.length > 0, '`token` is required')
	if (opts.type && opts.type !== 'oauth' && opts.type !== 'pcloud') {
		throw new TypeError('`type` must be either `oauth` or `pcloud`')
	}

	let token = opts.token
	let apiServer = opts.apiServer ?? DEFAULT_API_SERVER
	const clientType = opts.type ?? 'oauth'
	const coalesceReads = opts.coalesceReads !== false
	let coalesceScope = `c${randomString(12)}`

	const callInternal = async <T>(
		method: string,
		params: Record<string, Primitive | undefined> = {},
		callOpts: CallOptions = {},
	): Promise<T> => {
		const authEntry: AuthEntry | undefined = isAuthMethod(method)
			? [clientType === 'pcloud' ? 'auth' : 'access_token', token]
			: undefined

		const execute = (): Promise<T> =>
			apiRequest<T>(apiServer, method, {
				...callOpts,
				params,
				...(authEntry ? { auth: authEntry } : {}),
				noCoalesce: !coalesceReads,
				coalesceScope,
			})

		try {
			return await execute()
		} catch (err) {
			if (
				err instanceof PcloudNetworkError &&
				(err.status === 500 || err.status === undefined) &&
				apiServer !== FALLBACK_API_SERVER
			) {
				apiServer = FALLBACK_API_SERVER
				return execute()
			}
			throw err
		}
	}

	const ctx: ClientContext = { call: callInternal }

	const client: Client = {
		call: callInternal as Client['call'],
		callRaw: callInternal as Client['callRaw'],

		setToken(newToken: string): void {
			token = newToken
			// Bust the coalesce key space so in-flight reads under the previous
			// token can't be returned to callers that now use a different one.
			coalesceScope = `c${randomString(12)}`
		},

		async setupProxy(): Promise<string> {
			const res = await callInternal<{ api: string[] }>('getapiserver')
			const server = res.api[0]
			if (server && PCLOUD_HOST_PATTERN.test(server)) apiServer = server
			return apiServer
		},

		userinfo: methods.userinfo(ctx),
		listfolder: methods.listfolder(ctx),
		createfolder: methods.createfolder(ctx),
		deletefile: methods.deletefile(ctx),
		deletefolder: methods.deletefolder(ctx),
		movefile: methods.movefile(ctx),
		movefolder: methods.movefolder(ctx),
		renamefile: methods.renamefile(ctx),
		renamefolder: methods.renamefolder(ctx),
		getfilelink: methods.getfilelink(ctx),
		getthumblink: methods.getthumblink(ctx),
		sharefolder: methods.sharefolder(ctx),
		appshare: methods.appshare(ctx),
		login: methods.login(ctx),
		register: methods.register(ctx),
		remoteupload: methods.remoteupload(ctx),
		upload: methods.upload(ctx),
		download: methods.download(),
		downloadfile: methods.downloadfile(ctx),
		getthumbsfileids: methods.getthumbsfileids(ctx),
	}

	if (opts.useProxy) void client.setupProxy()

	return client
}
