import type { FileMetadata, FolderMetadata, UserInfo } from '../../src/types/api'

export const PCLOUD_TOKEN = 'pcloud-test-token'
export const OAUTH_TOKEN = 'oauth-test-access-token'

export const CLIENT_ID = 'test-client-id'
export const APP_SECRET = 'test-app-secret'
export const REDIRECT_URI = 'http://localhost:5173/oauth-callback'
export const CODE = 'test-auth-code'

export const FILE: FileMetadata = {
	fileid: 42,
	parentfolderid: 0,
	name: 'hello.txt',
	isfolder: false,
	size: 13,
	contenttype: 'text/plain',
	hash: 'abc123',
	category: 0,
	id: 'f42',
	isshared: false,
	icon: 'file',
	created: '2024-01-01T00:00:00+00:00',
	modified: '2024-01-01T00:00:00+00:00',
}

export const SUB_FOLDER: FolderMetadata = {
	folderid: 1,
	parentfolderid: 0,
	name: 'photos',
	isfolder: true,
	id: 'd1',
	isshared: false,
	icon: 'folder',
	created: '2024-01-01T00:00:00+00:00',
	modified: '2024-01-01T00:00:00+00:00',
	contents: [],
}

export const FOLDER: FolderMetadata = {
	folderid: 0,
	name: 'My pCloud',
	isfolder: true,
	id: 'd0',
	isshared: false,
	icon: 'folder',
	created: '2024-01-01T00:00:00+00:00',
	modified: '2024-01-01T00:00:00+00:00',
	contents: [SUB_FOLDER, FILE],
}

export const USER: UserInfo = {
	userid: 1,
	email: 'tester@example.com',
	emailverified: true,
	quota: 10_737_418_240,
	usedquota: 1_073_741_824,
	language: 'en',
	premium: false,
}
