import type { Progress, ProgressCallback } from '../types/progress'

export function makeProgressStream(
	onProgress: ProgressCallback,
	direction: 'upload' | 'download',
	total?: number,
): TransformStream<Uint8Array, Uint8Array> {
	let loaded = 0
	return new TransformStream<Uint8Array, Uint8Array>({
		transform(chunk, controller) {
			loaded += chunk.byteLength
			const event: Progress = { direction, loaded, total }
			onProgress(event)
			controller.enqueue(chunk)
		},
	})
}
