import { expectTypeOf } from 'expect-type'
import { expect, it } from 'vitest'
import { PathParams, generatePath } from './path'

it('generates path without parameters', () => {
  const result = generatePath('/users')
  expect(result).toBe('/users')
})

it('generates path with single parameter', () => {
  const result = generatePath('/users/:id', { id: '1' })
  expect(result).toBe('/users/1')
})

it('handles numeric parameters', () => {
  const result = generatePath('/users/:id', { id: 1 })
  expect(result).toBe('/users/1')
})

it('generates path with multiple parameters', () => {
  const result = generatePath(
    '/users/:userId/posts/:postId/comments/:commentId',
    {
      userId: 1,
      postId: '2',
      commentId: '3',
    }
  )
  expect(result).toBe('/users/1/posts/2/comments/3')
})

it('throws error for missing required parameter', () => {
  expect(() => {
    generatePath('/users/:id', {} as any)
  }).toThrow('Missing required path parameter: id')
})

it('throws error for undefined parameter', () => {
  expect(() => {
    generatePath('/users/:id', { id: undefined as any })
  }).toThrow('Missing required path parameter: id')
})

it('handles parameters with underscores', () => {
  const result = generatePath('/users/:user_id', { user_id: '123' })
  expect(result).toBe('/users/123')
})

it('handles parameters with numbers', () => {
  const result = generatePath('/users/:user1', { user1: '123' })
  expect(result).toBe('/users/123')
})

it('handles empty path', () => {
  const result = generatePath('')
  expect(result).toBe('')
})

describe('PathParams', () => {
  it('infers path parameters when query strings contain equals', () => {
    expectTypeOf<PathParams<'/users/:id?x=1'>>().toEqualTypeOf<{
      id: string | number
    }>()
  })

  it('infers path parameters when query strings contain ampersands', () => {
    expectTypeOf<PathParams<'/users/:id?param1&param2'>>().toEqualTypeOf<{
      id: string | number
    }>()
  })

  it('infers path parameters when query strings have mixed formats', () => {
    expectTypeOf<PathParams<'/users/:id?search=test&page=1'>>().toEqualTypeOf<{
      id: string | number
    }>()
  })

  it('infers path parameters when query strings have parameters without values', () => {
    expectTypeOf<PathParams<'/users/:id?flag&search=test'>>().toEqualTypeOf<{
      id: string | number
    }>()
  })

  it('infers path parameters when query strings have empty values', () => {
    expectTypeOf<PathParams<'/users/:id?empty=&filled=value'>>().toEqualTypeOf<{
      id: string | number
    }>()
  })

  it('infers path parameters when query strings have multiple parameters', () => {
    expectTypeOf<
      PathParams<'/users/:id?search=test&page=1&sort=name'>
    >().toEqualTypeOf<{ id: string | number }>()
  })

  it('preserves question marks that are part of optional path parameters', () => {
    expectTypeOf<PathParams<'/users/:id?'>>().toEqualTypeOf<{
      id: string | number
    }>()
  })

  it('infers path parameters from paths without query strings', () => {
    expectTypeOf<PathParams<'/users/:id'>>().toEqualTypeOf<{
      id: string | number
    }>()
  })

  it('infers multiple path parameters when query strings are present', () => {
    expectTypeOf<
      PathParams<'/users/:id/posts/:postId?sort=date'>
    >().toEqualTypeOf<{ id: string | number; postId: string | number }>()
  })

  it('infers single optional path parameter', () => {
    expectTypeOf<PathParams<'/posts/:postId?'>>().toEqualTypeOf<{
      postId: string | number
    }>()
  })

  it('infers two required path parameters', () => {
    expectTypeOf<PathParams<'/users/:id/posts/:postId'>>().toEqualTypeOf<{
      id: string | number
      postId: string | number
    }>()
  })

  it('infers mixed required and optional path parameters', () => {
    expectTypeOf<PathParams<'/users/:id/posts/:postId?'>>().toEqualTypeOf<{
      id: string | number
      postId: string | number
    }>()
  })

  it('infers multiple optional path parameters', () => {
    expectTypeOf<PathParams<'/users/:id?/posts/:postId?'>>().toEqualTypeOf<{
      id: string | number
      postId: string | number
    }>()
  })
})
