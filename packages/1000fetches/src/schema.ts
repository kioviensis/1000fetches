import type { StandardSchemaV1 } from '@standard-schema/spec'
import {
  AsyncSchemaValidationError,
  InvalidSchemaError,
  SchemaValidationError,
} from './errors'
import { Schema } from './types'

/**
 * Type guard to check if an object conforms to the Standard Schema V1 specification
 */
function isStandardSchema(obj: unknown): obj is StandardSchemaV1 {
  return (
    obj !== null &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    '~standard' in obj &&
    typeof obj['~standard'] === 'object' &&
    obj['~standard'] !== null &&
    'validate' in obj['~standard'] &&
    typeof obj['~standard'].validate === 'function' &&
    'version' in obj['~standard'] &&
    typeof obj['~standard'].version === 'number' &&
    'vendor' in obj['~standard'] &&
    typeof obj['~standard'].vendor === 'string'
  )
}

/**
 * Interface for schema validators that can validate data against schemas.
 *
 * This interface allows you to create custom schema validators that work
 * with different validation libraries (Zod, Valibot, Arktype, etc.).
 */
export interface SchemaValidator {
  /**
   * Validate data against a schema.
   *
   * @template T - The expected type after validation
   * @param schema - The schema to validate against
   * @param data - The data to validate
   * @returns The validated data with the correct type
   * @throws {SchemaValidationError} If the data doesn't match the schema
   */
  validate<T>(schema: Schema<T>, data: unknown): T

  /**
   * Check if an object is a valid schema.
   *
   * @param obj - The object to check
   * @returns True if the object is a valid schema, false otherwise
   */
  isSchema(obj: unknown): boolean
}

/**
 * Create a default schema validator that supports Standard Schema.
 *
 * This validator only works with schemas that implement the Standard Schema
 * interface. For full support of Zod, Valibot, and Arktype, use the
 * appropriate validator from their respective packages.
 *
 * @returns A schema validator instance
 *
 * @example
 * ```ts
 * import { createSchemaValidator } from '1000fetches'
 *
 * const validator = createSchemaValidator();
 *
 * // Use with HttpClient
 * const client = new HttpClient({
 *   schemaValidator: validator
 * });
 * ```
 */
export function createSchemaValidator(): SchemaValidator {
  return {
    validate<T>(schema: Schema<T>, data: unknown): T {
      if (!isStandardSchema(schema)) {
        throw new InvalidSchemaError(
          'Schema must implement the Standard Schema interface',
          schema
        )
      }

      const result = schema['~standard'].validate(data)

      if (result instanceof Promise) {
        throw new AsyncSchemaValidationError(
          'Async Standard Schema validation is not supported in this context',
          schema
        )
      }

      if (result.issues) {
        throw new SchemaValidationError(
          JSON.stringify(result.issues),
          schema,
          data
        )
      }

      return result.value as T
    },

    isSchema(obj: unknown): boolean {
      return isStandardSchema(obj)
    },
  }
}
