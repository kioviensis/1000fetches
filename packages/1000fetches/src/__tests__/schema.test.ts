import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { createHttpClient } from '../client'
import { SchemaValidationError } from '../errors'
import { createSchemaValidator, type SchemaValidator } from '../schema'
import { server } from '../testing/setup'

describe('createSchemaValidator', () => {
  it('should create a validator that supports Standard Schema', () => {
    const validator = createSchemaValidator()

    expect(validator).toBeDefined()
    expect(typeof validator.validate).toBe('function')
    expect(typeof validator.isSchema).toBe('function')
  })

  it('should correctly identify Standard Schema objects', () => {
    const validator = createSchemaValidator()
    const userSchema = z.object({
      id: z.number(),
      name: z.string(),
      email: z.email(),
    })

    expect(validator.isSchema(userSchema)).toBe(true)
    expect(validator.isSchema({})).toBe(false)
    expect(validator.isSchema(null)).toBe(false)
    expect(validator.isSchema(undefined)).toBe(false)
  })

  it('should validate data with Standard Schema', () => {
    const userSchema = z.object({
      id: z.number(),
      name: z.string(),
      email: z.email(),
    })

    const validator = createSchemaValidator()
    const testData = { id: 1, name: 'John', email: 'john@example.com' }

    const result = validator.validate(userSchema, testData)
    expect(result).toEqual(testData)
  })

  it('should throw error for non-Standard Schema', () => {
    const validator = createSchemaValidator()
    const nonStandardSchema = { someProperty: 'not a standard schema' }

    expect(() => {
      validator.validate(nonStandardSchema as any, {})
    }).toThrow('Schema must implement the Standard Schema interface')
  })
})

describe('Schema validator customization', () => {
  it('allows setting custom schema validator via constructor', async () => {
    const customValidator: SchemaValidator = {
      validate: vi.fn().mockImplementation((schema, data) => {
        if (data.status === 'error') {
          throw new SchemaValidationError(
            'Custom validation failed',
            schema,
            data
          )
        }
        return data
      }),
      isSchema: vi.fn().mockReturnValue(true),
    }

    const client = createHttpClient({
      baseUrl: 'https://api.example.com',
      timeout: 1000,
      schemaValidator: customValidator,
    })

    server.use(
      http.get('https://api.example.com/users', async () => {
        return HttpResponse.json({ status: 'error' })
      })
    )

    const schema = z.object({ status: z.string() })

    await expect(
      client.get('/users', {
        schema,
      })
    ).rejects.toThrow('Custom validation failed')

    expect(customValidator.validate).toHaveBeenCalledWith(schema, {
      status: 'error',
    })
  })

  it('uses default validator when none provided', async () => {
    const client = createHttpClient({
      baseUrl: 'https://api.example.com',
      timeout: 1000,
    })

    server.use(
      http.get('https://api.example.com/users', async () => {
        return HttpResponse.json({
          id: 1,
          name: 'John',
          email: 'john@example.com',
        })
      })
    )

    const testSchema = z.object({
      id: z.number(),
      name: z.string(),
      email: z.email(),
    })

    const response = await client.get('/users', { schema: testSchema })
    expect(response.data).toEqual({
      id: 1,
      name: 'John',
      email: 'john@example.com',
    })
  })
})
