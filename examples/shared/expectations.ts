import type { ScenarioResult } from './scenario'

export class ScenarioAssertionError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'ScenarioAssertionError'
	}
}

/**
 * Runner-agnostic assertions that the scenario produced the expected fixture
 * shape. Used by both the manual node script (no test runner) and any caller
 * that wants a single-call check.
 */
export function assertScenarioResult(result: ScenarioResult): void {
	const { root } = result
	if (root.folderid !== 0) {
		throw new ScenarioAssertionError(`expected root.folderid === 0, got ${String(root.folderid)}`)
	}
	if (root.isfolder !== true) {
		throw new ScenarioAssertionError('expected root.isfolder === true')
	}
	if (!Array.isArray(root.contents)) {
		throw new ScenarioAssertionError('expected root.contents to be an array')
	}
	if (root.contents.length === 0) {
		throw new ScenarioAssertionError('expected root.contents to be non-empty')
	}
}
