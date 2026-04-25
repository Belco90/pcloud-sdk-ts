import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		coverage: {
			provider: 'v8',
			include: ['src/**'],
		},
		projects: [
			{
				test: {
					name: 'unit',
					include: ['test/unit/**/*.test.ts'],
					environment: 'node',
				},
			},
			{
				test: {
					name: 'scenario-node',
					include: ['examples/node/**/*.scenario.test.ts'],
					environment: 'node',
					setupFiles: ['examples/node/vitest.setup.ts'],
				},
			},
			{
				test: {
					name: 'scenario-browser',
					include: ['examples/browser/**/*.scenario.test.ts'],
					setupFiles: ['examples/browser/vitest.setup.ts'],
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium' }],
						headless: true,
					},
				},
			},
		],
	},
})
