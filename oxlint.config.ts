import { defineConfig } from 'oxlint'

export default defineConfig({
	plugins: ['import', 'typescript', 'unicorn', 'vitest'],
	categories: {
		correctness: 'error',
		suspicious: 'error',
		perf: 'error',
	},
	rules: {
		'no-console': 'warn',
	},
	env: { es2022: true },
	ignorePatterns: ['dist', 'coverage', 'node_modules'],
	options: {
		denyWarnings: true,
		reportUnusedDisableDirectives: 'warn',
	},
})
