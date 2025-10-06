import { expectTypeOf } from 'expect-type'
import { beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { createHttpClient } from '../client'
import { HttpError, TimeoutError } from '../errors'
import { ResponseType } from '../types'

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.email(),
})

type User = z.infer<typeof userSchema>

let client: ReturnType<typeof createHttpClient>

beforeEach(() => {
  client = createHttpClient({
    baseUrl: 'https://api.example.com',
    timeout: 1000,
  })
})

describe('GET requests', () => {
  it('fetches users list without schema returns unknown', async () => {
    const usersResponse = await client.get('/users')
    expect(usersResponse.status).toBe(200)
    expectTypeOf(usersResponse).toEqualTypeOf<ResponseType<unknown>>()
  })

  it('returns complete response structure with all properties', async () => {
    const completeResponse = await client.get('/users')

    expect(completeResponse.status).toBe(200)
    expect(completeResponse.url).toBe('https://api.example.com/users')
    expect(completeResponse.headers).toBeDefined()
    expectTypeOf(completeResponse).toEqualTypeOf<ResponseType<unknown>>()
  })

  it('throws HttpError when server returns error status', async () => {
    await expect(client.get('/error')).rejects.toThrow(HttpError)
  })

  it('throws TimeoutError when request exceeds timeout limit', async () => {
    const fastTimeoutClient = createHttpClient({
      baseUrl: 'https://api.example.com',
      timeout: 100,
    })
    await expect(fastTimeoutClient.get('/timeout')).rejects.toThrow(
      TimeoutError
    )
  })

  it('returns typed response when schema provided', async () => {
    const typedResponse = await client.get('/users/:id', {
      pathParams: { id: '1' },
      schema: userSchema,
    })

    expect(typedResponse.data).toBeDefined()
    expectTypeOf(typedResponse).toEqualTypeOf<ResponseType<User>>()
  })

  it('validates response data against provided schema', async () => {
    const validatedResponse = await client.get('/users/:id', {
      pathParams: { id: '1' },
      schema: userSchema,
    })

    expect(validatedResponse.data).toBeDefined()
    expectTypeOf(validatedResponse.data).toEqualTypeOf<User>()
  })
})

describe('POST', () => {
  it('creates new user without schema returns unknown', async () => {
    const createResponse = await client.post('/users', {
      name: 'Alice Johnson',
      email: 'alice@example.com',
    })
    expectTypeOf(createResponse).toEqualTypeOf<ResponseType<unknown>>()
    expect(createResponse.status).toBe(201)
  })

  it('returns typed response when response schema provided', async () => {
    const typedCreateResponse = await client.post(
      '/users',
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
      },
      {
        schema: userSchema,
      }
    )

    expectTypeOf(typedCreateResponse).toEqualTypeOf<ResponseType<User>>()
    expect(typedCreateResponse.data).toBeDefined()
  })

  it('supports FormData for file uploads', async () => {
    const formData = new FormData()
    formData.append('name', 'Alice Johnson')
    formData.append('email', 'alice@example.com')

    const formResponse = await client.post('/users', formData)
    expect(formResponse.status).toBe(201)
    expectTypeOf(formResponse).toEqualTypeOf<ResponseType<unknown>>()
  })

  it('supports URLSearchParams', async () => {
    const params = new URLSearchParams()
    params.append('name', 'Alice Johnson')
    params.append('email', 'alice@example.com')

    const paramsResponse = await client.post('/users', params)
    expect(paramsResponse.status).toBe(201)
  })

  it('supports Blob uploads', async () => {
    const blob = new Blob(['test content'], { type: 'text/plain' })
    const blobResponse = await client.post('/upload', blob)
    expect(blobResponse.status).toBe(201)
  })
})

describe('DELETE requests', () => {
  it('works with path parameters on DELETE requests without schema returns unknown', async () => {
    const deleteResponse = await client.delete('/users/:id', {
      pathParams: { id: '1' },
    })

    expect(deleteResponse.status).toBe(200)
    expectTypeOf(deleteResponse).toEqualTypeOf<ResponseType<unknown>>()
  })

  it('infers response type with schema on DELETE requests', async () => {
    const deleteResponseSchema = z.object({ success: z.boolean() })
    const typedDeleteResponse = await client.delete('/users/:id', {
      pathParams: { id: '1' },
      schema: deleteResponseSchema,
    })

    expectTypeOf(typedDeleteResponse.data).toEqualTypeOf<{ success: boolean }>()
  })
})

it('handles request cancellation with AbortController', async () => {
  const abortController = new AbortController()

  const cancelledResponse = await client.get('/slow-request', {
    signal: abortController.signal,
    schema: z.any(),
  })
  expect(cancelledResponse.status).toBe(200)
})

describe('Schema Validation', () => {
  it('handles schema validation with deeply nested objects and unions', async () => {
    const addressSchema = z.object({
      street: z.string(),
      city: z.string(),
      country: z.string(),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
    })

    const profileSchema = z.object({
      bio: z.string(),
      avatar: z.url(),
      social: z.object({
        twitter: z.string().optional(),
        linkedin: z.string().optional(),
      }),
    })

    const complexUserSchema = z.object({
      id: z.number(),
      name: z.string(),
      email: z.email(),
      status: z.union([
        z.literal('active'),
        z.literal('inactive'),
        z.literal('pending'),
      ]),
      address: addressSchema,
      profile: profileSchema,
      metadata: z.object({
        createdAt: z.iso.datetime(),
        lastLogin: z.iso.datetime().optional(),
        permissions: z.array(z.string()),
      }),
    })

    const detailedUserResponse = await client.get('/users/:id/detailed', {
      pathParams: { id: '1' },
      schema: complexUserSchema,
    })

    expectTypeOf(detailedUserResponse.data).toEqualTypeOf<
      z.infer<typeof complexUserSchema>
    >()
  })
})

describe('Data Extractor', () => {
  it('extracts response data with .data()', async () => {
    const extractedUser = await client
      .get('/users/:id', {
        pathParams: { id: '1' },
        schema: userSchema,
      })
      .data()

    expect(extractedUser.id).toBe(1)
    expectTypeOf(extractedUser).toEqualTypeOf<User>()
  })

  it('extracts data from GET requests without schema', async () => {
    const rawData = await client
      .get('/users/:id', {
        pathParams: { id: '1' },
      })
      .data()

    expect(rawData).toBeDefined()
    expect((rawData as any).id).toBe(1)
    expectTypeOf(rawData).toBeUnknown()
  })

  it('supports data extraction on POST requests', async () => {
    const createdUser = await client
      .post(
        '/users',
        {
          name: 'Test User',
          email: 'test@example.com',
        },
        { schema: userSchema }
      )
      .data()

    expect(createdUser.id).toBe(3)
    expectTypeOf(createdUser).toEqualTypeOf<User>()
  })

  it('supports data extraction on PUT requests', async () => {
    const updatedUser = await client
      .put(
        '/users/:id',
        {
          name: 'Updated User',
          email: 'updated@example.com',
        },
        {
          pathParams: { id: '1' },
          schema: userSchema,
        }
      )
      .data()

    expect(updatedUser.name).toBe('Updated User')
    expectTypeOf(updatedUser).toEqualTypeOf<User>()
  })

  it('supports data extraction on PATCH requests', async () => {
    const patchedUser = await client
      .patch(
        '/users/:id',
        { name: 'Patched User' },
        {
          pathParams: { id: '1' },
          schema: userSchema,
        }
      )
      .data()

    expect(patchedUser.name).toBe('Patched User')
    expectTypeOf(patchedUser).toEqualTypeOf<User>()
  })

  it('supports data extraction on DELETE requests', async () => {
    const deleteSchema = z.object({ success: z.boolean() })
    const deleteResult = await client
      .delete('/users/:id', {
        pathParams: { id: '1' },
        schema: deleteSchema,
      })
      .data()

    expect(deleteResult.success).toBe(true)
    expectTypeOf(deleteResult).toEqualTypeOf<{ success: boolean }>()
  })

  it('fails gracefully when request fails', async () => {
    await expect(client.get('/error').data()).rejects.toThrow(HttpError)
  })

  it('works with retry logic', async () => {
    const retryClient = createHttpClient({
      baseUrl: 'https://api.example.com',
      timeout: 5000,
      retryOptions: {
        maxRetries: 3,
        retryDelay: 10,
        retryStatusCodes: [500],
      },
    })

    const retryData = await retryClient.get('/retry-test').data()
    expect(retryData).toEqual({ success: true })
  })

  it('allows accessing full response when not using .data()', async () => {
    const fullResponse = await client.get('/users/:id', {
      pathParams: { id: '1' },
      schema: userSchema,
    })

    expect(fullResponse.data).toBeDefined()
    expect(fullResponse.status).toBe(200)
    expect(fullResponse.headers).toBeDefined()
    expectTypeOf(fullResponse.data).toEqualTypeOf<User>()
  })
})

describe('Relative URL Support', () => {
  it('accepts relative paths as baseUrl', () => {
    const relativeClient = createHttpClient({
      baseUrl: '/api',
    })

    expect(relativeClient).toBeDefined()
  })

  it('works with empty baseUrl in Node environment', async () => {
    const noBaseClient = createHttpClient()
    const absoluteUrlResponse = await noBaseClient.get(
      'https://api.example.com/users'
    )
    expect(absoluteUrlResponse.status).toBe(200)
  })

  it('works with empty baseUrl and uses full URLs in requests', async () => {
    const noBaseClient = createHttpClient()
    const fullUrlResponse = await noBaseClient.get(
      'https://api.example.com/users'
    )
    expect(fullUrlResponse.status).toBe(200)
    expect(fullUrlResponse.data).toBeDefined()
  })

  it('handles relative baseUrl paths with leading slash', () => {
    const apiClient = createHttpClient({ baseUrl: '/api' })
    expect(apiClient).toBeDefined()
    const apiClientWithSlash = createHttpClient({ baseUrl: '/api/' })
    expect(apiClientWithSlash).toBeDefined()
  })

  it('handles absolute URLs correctly', async () => {
    const absoluteClient = createHttpClient({
      baseUrl: 'https://api.example.com',
    })
    const response = await absoluteClient.get('/users')
    expect(response.status).toBe(200)
    expect(response.url).toBe('https://api.example.com/users')
  })

  it('throws error for invalid baseUrl', () => {
    expect(() => {
      createHttpClient({
        baseUrl: 'not-a-valid-url',
      })
    }).toThrow('Invalid baseUrl')

    expect(() => {
      createHttpClient({
        baseUrl: 'ht!tp://invalid',
      })
    }).toThrow('Invalid baseUrl')
  })

  it('handles baseUrl with trailing slash correctly', () => {
    const clientWithSlash = createHttpClient({
      baseUrl: 'https://api.example.com/',
    })
    expect(clientWithSlash).toBeDefined()
  })

  it('constructs correct URLs when baseUrl has no trailing slash', async () => {
    const response = await client.get('/users')
    expect(response.url).toBe('https://api.example.com/users')
  })

  it('handles paths that start without slash', async () => {
    const response = await client.get('users')
    expect(response.status).toBe(200)
    expect(response.url).toBe('https://api.example.com/users')
  })

  it('handles absolute URLs in request even when baseUrl is set', async () => {
    const response = await client.get('https://api.example.com/test', {
      schema: z.any(),
    })
    expect(response.status).toBe(200)
    expect(response.url).toBe('https://api.example.com/test')
  })
})
