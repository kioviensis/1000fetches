import { beforeEach, expect, it } from 'vitest'
import { createHttpClient } from '../client'

let client: ReturnType<typeof createHttpClient>

beforeEach(() => {
  client = createHttpClient({
    baseUrl: 'https://api.example.com',
  })
})

it('serializes string arrays as multiple parameters', async () => {
  const response = await client.get('/users', {
    params: {
      tags: ['javascript', 'typescript', 'react'],
    },
  })

  expect(response.url).toBe(
    'https://api.example.com/users?tags=javascript&tags=typescript&tags=react'
  )
})

it('handles mixed array types with strings and numbers', async () => {
  const response = await client.get('/users', {
    params: {
      categories: ['tech', 'web'],
      ids: [1, 2, 3],
    },
  })

  expect(response.url).toBe(
    'https://api.example.com/users?categories=tech&categories=web&ids=1&ids=2&ids=3'
  )
})

it('skips undefined values in arrays', async () => {
  const response = await client.get('/users', {
    params: {
      tags: ['active', undefined, 'inactive'],
    },
  })

  expect(response.url).toBe(
    'https://api.example.com/users?tags=active&tags=inactive'
  )
})

it('skips null values in arrays', async () => {
  const response = await client.get('/users', {
    params: {
      tags: ['active', null, 'inactive'],
    },
  })

  expect(response.url).toBe(
    'https://api.example.com/users?tags=active&tags=inactive'
  )
})

it('skips both undefined and null values in arrays', async () => {
  const response = await client.get('/users', {
    params: {
      tags: ['active', undefined, null, 'inactive'],
    },
  })

  expect(response.url).toBe(
    'https://api.example.com/users?tags=active&tags=inactive'
  )
})

it('converts numbers to strings', async () => {
  const response = await client.get('/users', {
    params: {
      page: 1,
      limit: 10,
    },
  })

  expect(response.url).toBe('https://api.example.com/users?page=1&limit=10')
})

it('converts booleans to strings', async () => {
  const response = await client.get('/posts/:id', {
    pathParams: { id: '1' },
    params: {
      published: true,
      featured: false,
    },
  })

  expect(response.url).toBe(
    'https://api.example.com/posts/1?published=true&featured=false'
  )
})

it('handles string values correctly', async () => {
  const response = await client.get('/users', {
    params: {
      q: 'hello world',
      sort: 'date',
    },
  })

  expect(response.url).toBe(
    'https://api.example.com/users?q=hello+world&sort=date'
  )
})

it('omits undefined values from query string', async () => {
  const response = await client.get('/users', {
    params: {
      name: 'john',
      age: undefined,
      city: 'london',
    },
  })

  expect(response.url).toBe(
    'https://api.example.com/users?name=john&city=london'
  )
})

it('omits null values from query string', async () => {
  const response = await client.get('/users', {
    params: {
      name: 'john',
      age: null,
      city: 'london',
    },
  })

  expect(response.url).toBe(
    'https://api.example.com/users?name=john&city=london'
  )
})

it('handles all undefined values', async () => {
  const response = await client.get('/users', {
    params: {
      name: undefined,
      age: undefined,
    },
  })

  expect(response.url).toBe('https://api.example.com/users')
})

it('handles all null values', async () => {
  const response = await client.get('/users', {
    params: {
      name: null,
      age: null,
    },
  })

  expect(response.url).toBe('https://api.example.com/users')
})

it('handles complex parameter combinations with mixed types', async () => {
  const response = await client.get('/users', {
    params: {
      q: 'typescript',
      tags: ['web', 'frontend'],
      page: 1,
      limit: 20,
      published: true,
      author: undefined,
      categories: ['tech', 'programming'],
    },
  })

  expect(response.url).toBe(
    'https://api.example.com/users?q=typescript&tags=web&tags=frontend&page=1&limit=20&published=true&categories=tech&categories=programming'
  )
})

it('properly encodes special characters', async () => {
  const response = await client.get('/users', {
    params: {
      q: 'hello & goodbye',
      filter: 'price < 100',
    },
  })

  expect(response.url).toBe(
    'https://api.example.com/users?q=hello+%26+goodbye&filter=price+%3C+100'
  )
})

it('handles unicode characters', async () => {
  const response = await client.get('/users', {
    params: {
      q: 'café',
      city: 'São Paulo',
    },
  })

  expect(response.url).toBe(
    'https://api.example.com/users?q=caf%C3%A9&city=S%C3%A3o+Paulo'
  )
})

it('handles empty object', async () => {
  const response = await client.get('/users', {
    params: {},
  })

  expect(response.url).toBe('https://api.example.com/users')
})

it('handles empty arrays', async () => {
  const response = await client.get('/users', {
    params: {
      tags: [],
      categories: [],
    },
  })

  expect(response.url).toBe('https://api.example.com/users')
})

it('uses custom serializer when provided', async () => {
  const customClient = createHttpClient({
    baseUrl: 'https://api.example.com',
    serializeParams: params => {
      return Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${value}`)
        .join('&')
    },
  })

  const response = await customClient.get('/users', {
    params: {
      q: 'test',
      tags: ['a', 'b'],
    },
  })

  expect(response.url).toBe('https://api.example.com/users?q=test&tags=a,b')
})

it('handles custom serializer returning query string with question mark', async () => {
  const customClient = createHttpClient({
    baseUrl: 'https://api.example.com',
    serializeParams: params => {
      const query = Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${value}`)
        .join('&')
      return query ? `?${query}` : ''
    },
  })

  const response = await customClient.get('/users', {
    params: {
      q: 'test',
    },
  })

  expect(response.url).toBe('https://api.example.com/users?q=test')
})
