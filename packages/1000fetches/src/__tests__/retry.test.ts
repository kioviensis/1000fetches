import { expectTypeOf } from 'expect-type'
import { expect, it } from 'vitest'
import { createHttpClient } from '../client'
import { HttpError } from '../errors'
import { ResponseType } from '../types'

it('retries on 500 errors and eventually succeeds', async () => {
  const retryClient = createHttpClient({
    baseUrl: 'https://api.example.com',
    retryOptions: {
      maxRetries: 2,
      retryDelay: 1,
      retryStatusCodes: [500],
    },
  })

  const retryResponse = await retryClient.get('/retry-test')
  expectTypeOf(retryResponse).toEqualTypeOf<ResponseType<unknown>>()
  expect(retryResponse.data).toEqual({ success: true })
})

it('does not retry on 400 client errors', async () => {
  const retryClient = createHttpClient({
    baseUrl: 'https://api.example.com',
    retryOptions: {
      maxRetries: 2,
      retryStatusCodes: [500, 502, 503],
    },
  })

  await expect(retryClient.get('/bad-request')).rejects.toThrow(HttpError)
})

it('uses exponential backoff with increasing delays', async () => {
  const retryClient = createHttpClient({
    baseUrl: 'https://api.example.com',
    retryOptions: {
      maxRetries: 2,
      retryDelay: 10,
      backoffFactor: 2,
    },
  })

  const startTime = Date.now()
  await expect(retryClient.get('/backoff-test')).rejects.toThrow(HttpError)
  const endTime = Date.now()

  expect(endTime - startTime).toBeGreaterThan(25)
})

it('retries on network errors when enabled', async () => {
  const retryClient = createHttpClient({
    baseUrl: 'https://api.example.com',
    retryOptions: {
      maxRetries: 1,
      retryNetworkErrors: true,
    },
  })

  const networkRetryResponse = await retryClient.get('/network-retry')
  expectTypeOf(networkRetryResponse).toEqualTypeOf<ResponseType<unknown>>()
  expect(networkRetryResponse.data).toEqual({ success: true })
})
