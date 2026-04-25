import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { worker } from './worker'

const realMode = import.meta.env.VITE_PCLOUD_REAL === '1'

if (!realMode) {
	await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
}

createRoot(document.querySelector<HTMLElement>('#root')!).render(
	<StrictMode>
		<App realMode={realMode} />
	</StrictMode>,
)
