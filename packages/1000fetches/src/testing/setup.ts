import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { handlers, resetState } from './handlers'

export const server = setupServer(...handlers)

beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn',
  })
})

afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()

  resetState()
})

afterAll(() => {
  server.close()
})

process.on('unhandledRejection', reason => {
  if (
    reason &&
    typeof reason === 'object' &&
    'name' in reason &&
    reason.name === 'PathParameterError'
  ) {
    return
  }

  throw reason
})
