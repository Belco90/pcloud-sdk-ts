/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_PCLOUD_REAL?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
