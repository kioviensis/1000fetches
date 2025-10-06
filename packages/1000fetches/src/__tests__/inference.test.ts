import { expectTypeOf } from 'expect-type'
import { beforeEach, it } from 'vitest'
import { z } from 'zod'

import { createHttpClient } from '../client'
import { ResponseType } from '../types'

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.email(),
})

let client: ReturnType<typeof createHttpClient>

beforeEach(() => {
  client = createHttpClient({
    baseUrl: 'https://api.example.com',
    timeout: 1000,
  })
})

it('should infer User type from schema on GET requests', async () => {
  const response = await client.get('/users/:id', {
    pathParams: { id: 1 },
    schema: userSchema,
  })
  expectTypeOf(response).toEqualTypeOf<
    ResponseType<z.infer<typeof userSchema>>
  >()
})

it('should infer User type from schema on POST requests', async () => {
  const newUser = { name: 'Alice', email: 'alice@example.com' }
  const response = await client.post('/users', newUser, {
    schema: userSchema,
  })
  expectTypeOf(response).toEqualTypeOf<
    ResponseType<z.infer<typeof userSchema>>
  >()
})

it('should infer User type from schema on PUT requests', async () => {
  const updatedUser = { name: 'Updated John', email: 'john@example.com' }
  const response = await client.put('/users/:id', updatedUser, {
    pathParams: { id: '1' },
    schema: userSchema,
  })
  expectTypeOf(response).toEqualTypeOf<
    ResponseType<z.infer<typeof userSchema>>
  >()
})

it('should infer User type from schema on PATCH requests', async () => {
  const partialUpdate = { name: 'John Updated' }
  const response = await client.patch('/users/:id', partialUpdate, {
    pathParams: { id: '1' },
    schema: userSchema,
  })
  expectTypeOf(response).toEqualTypeOf<
    ResponseType<z.infer<typeof userSchema>>
  >()
})

it('should infer DeleteResponse type from schema on DELETE requests', async () => {
  const deleteResponseSchema = z.object({ success: z.boolean() })
  const response = await client.delete('/users/:id', {
    pathParams: { id: '1' },
    schema: deleteResponseSchema,
  })
  expectTypeOf(response).toEqualTypeOf<
    ResponseType<z.infer<typeof deleteResponseSchema>>
  >()
})

it('defaults to unknown type when no schema provided', async () => {
  const response = await client.get('/users/:id', {
    pathParams: { id: '1' },
  })
  expectTypeOf(response).toEqualTypeOf<ResponseType<unknown>>()
})

it('defaults to unknown type for POST requests without schema', async () => {
  const newUser = { name: 'Alice', email: 'alice@example.com' }
  const response = await client.post('/users', newUser)
  expectTypeOf(response).toEqualTypeOf<ResponseType<unknown>>()
})
