import { setupServer } from 'msw/node'

import { makeHandlers } from '../shared/handlers'

export const server = setupServer(...makeHandlers())
