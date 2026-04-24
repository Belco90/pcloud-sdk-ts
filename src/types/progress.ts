export interface Progress {
	direction: 'upload' | 'download'
	loaded: number
	total: number | undefined
}

export type ProgressCallback = (progress: Progress) => void
