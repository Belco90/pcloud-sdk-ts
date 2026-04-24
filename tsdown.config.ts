import { defineConfig } from 'tsdown'

export default defineConfig({
	entry: {
		index: 'src/index.ts',
		oauth: 'src/oauth.ts',
		'oauth-browser': 'src/oauth-browser.ts',
		errors: 'src/errors.ts',
	},
	sourcemap: true,
	platform: 'neutral',
	deps: { neverBundle: [/^node:/] },
	attw: {
		// enabled: 'ci-only',
		profile: 'esm-only',
		level: 'error',
	},
	publint: {
		// enabled: 'ci-only',
		level: 'error',
	},
})
