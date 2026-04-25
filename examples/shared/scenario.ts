import type { Client } from '../../src/client'
import type { FolderMetadata } from '../../src/types/api'

export interface ScenarioResult {
	root: FolderMetadata
}

/**
 * Run the canonical listfolder scenario against any Client. The caller decides
 * how the client was constructed (auth mode, token, host) — this function
 * is auth-mode-agnostic on purpose so the same code paths exercise both.
 */
export async function runScenario(client: Client): Promise<ScenarioResult> {
	const root = await client.listfolder(0)
	return { root }
}
