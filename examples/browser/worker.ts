import { setupWorker } from 'msw/browser'

import { makeHandlers } from '../shared/handlers'

export const worker = setupWorker(...makeHandlers())
