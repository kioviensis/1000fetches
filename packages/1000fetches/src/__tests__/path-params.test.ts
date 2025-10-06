import { beforeEach, describe, expect, it } from 'vitest'
import { createHttpClient } from '../client'

let client: ReturnType<typeof createHttpClient>

beforeEach(() => {
  client = createHttpClient({ baseUrl: 'https://api.example.com' })
})

describe('fails with invalid pathParams', () => {
  it('when get', () => {
    // @ts-expect-error
    client.get('/users/:id')

    // @ts-expect-error
    client.get('/users/:id', {})

    client
      // @ts-expect-error
      .get('/users/:id', {
        params: { test: 'test' },
      })

    client.get('/users/:id', {
      // @ts-expect-error
      pathParams: {},
    })

    client.get('/users/:id', {
      // @ts-expect-error
      pathParams: { id2: 2 },
    })
  })

  it('when post', () => {
    // @ts-expect-error
    client.post('/users/:id')

    // @ts-expect-error
    client.post('/users/:id', { name: 'Test' })

    // @ts-expect-error
    client.post('/users/:id', undefined)

    // @ts-expect-error
    client.post('/users/:id', { name: 'Test' }, {})

    client
      // @ts-expect-error
      .post('/users/:id', { name: 'Test' }, { params: { test: 'test' } })

    client.post(
      '/users/:id',
      { name: 'Test' },
      // @ts-expect-error
      { pathParams: { test: 'test' } }
    )
  })

  it('when put', () => {
    // @ts-expect-error
    client.put('/users/:id')

    // @ts-expect-error
    client.put('/users/:id', { name: 'Test' })

    // @ts-expect-error
    client.put('/users/:id', undefined)

    // @ts-expect-error
    client.put('/users/:id', { name: 'Test' }, {})

    client
      // @ts-expect-error
      .put('/users/:id', { name: 'Test' }, { params: { test: 'test' } })

    client.put(
      '/users/:id',
      { name: 'Test' },
      // @ts-expect-error
      { pathParams: { test: 'test' } }
    )

    client.put('/users/:id', { name: 'Test' }, { pathParams: { id: 1 } })
  })

  it('when patch', () => {
    // @ts-expect-error
    client.patch('/users/:id')

    // @ts-expect-error
    client.patch('/users/:id', { name: 'Test' })

    // @ts-expect-error
    client.patch('/users/:id', undefined)

    // @ts-expect-error
    client.patch('/users/:id', { name: 'Test' }, {})

    client
      // @ts-expect-error
      .patch('/users/:id', { name: 'Test' }, { params: { test: 'test' } })

    client.patch(
      '/users/:id',
      { name: 'Test' },
      // @ts-expect-error
      { pathParams: { test: 'test' } }
    )
  })

  it('when delete', () => {
    // @ts-expect-error
    client.delete('/users/:id')

    // @ts-expect-error
    client.delete('/users/:id', {})

    client
      // @ts-expect-error
      .delete('/users/:id', {
        params: { test: 'test' },
      })

    client.delete('/users/:id', {
      // @ts-expect-error
      pathParams: {},
    })

    client.delete('/users/:id', {
      // @ts-expect-error
      pathParams: { id2: 2 },
    })
  })
})

it('when variable in middle of path', async () => {
  const getResponse = await client.get('/users/:id/posts/:postId', {
    pathParams: { id: '1', postId: '10' },
  })
  expect(getResponse).toBeDefined()

  // @ts-expect-error
  client.get('/users/:id/posts/:postId')
})

it('when no variables present', async () => {
  const healthResponse = await client.get('/test')
  expect(healthResponse).toBeDefined()

  const postResponse = await client.post('/users', { name: 'a' })
  expect(postResponse).toBeDefined()

  const putResponse = await client.put('/users', { name: 'b' })
  expect(putResponse).toBeDefined()

  const patchResponse = await client.patch('/users', { name: 'c' })
  expect(patchResponse).toBeDefined()

  const deleteResponse = await client.delete('/users')
  expect(deleteResponse).toBeDefined()
})

it('when absolute URL', async () => {
  const usersResponse = await client.get('https://api.example.com/users')
  expect(usersResponse).toBeDefined()

  const postResponse = await client.get('https://api.example.com/posts/:id', {
    pathParams: { id: '5' },
  })
  expect(postResponse).toBeDefined()

  // @ts-expect-error
  client.get('https://api.example.com/posts/:id')
})

it('when optional path params are treated as required', async () => {
  // @ts-expect-error
  client.get('/users/:id?')

  client.get('/users/:id?', { pathParams: { id: '1' } })

  client.get('/users/:id?/posts/:postId?', {
    pathParams: { id: '1', postId: '123' },
  })
})

it('should handle URLs with query strings correctly', async () => {
  const usersWithQuery = await client.get('/users?page=1&limit=10')
  expect(usersWithQuery).toBeDefined()

  const userWithQuery = await client.get('/users/:id?page=1&limit=10', {
    pathParams: { id: '123' },
  })
  expect(userWithQuery).toBeDefined()

  const postWithQuery = await client.get('/users/:id/posts/:postId?sort=date', {
    pathParams: { id: '123', postId: '456' },
  })
  expect(postWithQuery).toBeDefined()

  const absoluteUrlWithQuery = await client.get(
    'https://api.example.com/users?page=1'
  )
  expect(absoluteUrlWithQuery).toBeDefined()
})

it('should handle edge cases correctly', async () => {
  const usersWithHash = await client.get('/users#section')
  expect(usersWithHash).toBeDefined()

  const usersWithQueryAndHash = await client.get('/users?page=1#section')
  expect(usersWithQueryAndHash).toBeDefined()

  const userWithQueryAndHash = await client.get('/users/:id?page=1#section', {
    pathParams: { id: '123' },
  })
  expect(userWithQueryAndHash).toBeDefined()

  const usersWithEmptyQuery = await client.get('/users?')
  expect(usersWithEmptyQuery).toBeDefined()
})

it('should reject on invalid path params', async () => {
  // @ts-expect-error
  await expect(client.get('/users/:id')).rejects.toThrow()

  // @ts-expect-error
  await expect(client.get('/users/:id?')).rejects.toThrow()
})
