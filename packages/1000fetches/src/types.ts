import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { RequirePathParams } from './utils'

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number
  /** Base delay between retries in milliseconds (default: 300) */
  retryDelay?: number
  /** Exponential backoff factor (default: 2) */
  backoffFactor?: number
  /** Status codes that should trigger a retry (default: [408, 429, 500, 502, 503, 504]) */
  retryStatusCodes?: number[]
  /** Whether to retry on network errors (default: true) */
  retryNetworkErrors?: boolean
  /** Maximum retry delay in milliseconds (default: 30_000) */
  maxRetryDelay?: number
  /** Custom function to determine if a request should be retried */
  shouldRetry?: (error: Error, retryCount: number) => boolean | Promise<boolean>
}

export type EnforcedPathParamsOptions<
  TBody = unknown,
  TResponse = unknown,
  TParams extends RequestParamsType = RequestParamsType,
  Path extends string = string,
> = RequirePathParams<
  Path,
  Omit<RequestOptions<TBody>, 'params'> & {
    params?: TParams
    schema?: Schema<TResponse>
  }
>

export type SchemaInferredRequestOptions<
  TBody = unknown,
  TResponse = unknown,
  TParams extends RequestParamsType = RequestParamsType,
  Path extends string = string,
> = RequirePathParams<
  Path,
  Omit<RequestOptions<TBody>, 'params'> & {
    params?: TParams
    // Accept any schema-like object (Zod, schemaOf, StandardSchema, etc.)
    // The actual type checking happens via InferSchemaOutput
    schema: { parse?: TResponse } | StandardSchemaV1
  }
>

export interface RequestOptions<TBody = unknown> {
  headers?: Record<string, string>
  params?: RequestParamsType
  body?: TBody
  timeout?: number
  signal?: AbortSignal
  validateStatus?: (status: number) => boolean
  responseType?: 'text' | 'blob' | 'arrayBuffer'
  cache?: RequestCache
  credentials?: RequestCredentials
  mode?: RequestMode
  redirect?: RequestRedirect
  retry?: RetryOptions | boolean
  onUploadStreaming?: (event: UploadStreamingEvent) => void
  onDownloadStreaming?: (event: DownloadStreamingEvent) => void
}

export interface ResponseType<T = unknown> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
  method: HttpMethod
  url: string
  raw: Response
}

/**
 * Request context that can be modified by onRequest hook
 */
export interface RequestContext<TBody = unknown> {
  /** The URL to send the request to */
  url: string
  /** The HTTP method (GET, POST, etc.) */
  method: HttpMethod
  /** Query parameters to append to the URL */
  params?: RequestParamsType
  /** Headers to send with the request */
  headers: Headers
  /** Request body */
  body?: TBody
  /** AbortSignal for request cancellation */
  signal?: AbortSignal
  /** Fetch options */
  fetchOptions: Omit<RequestInit, 'body' | 'headers' | 'signal' | 'method'>
}

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'HEAD'
  | 'OPTIONS'

export type RequestParamsType = Record<
  string,
  | string
  | number
  | boolean
  | (string | number | boolean | undefined | null)[]
  | undefined
  | null
>

export type Schema<T = unknown> =
  | StandardSchemaV1<unknown, T>
  | (StandardSchemaV1<unknown, T> & { _output: T })
  | (StandardSchemaV1<unknown, T> & { _output?: T })

// Detect if it's a Zod schema by checking for _def property
type IsZodSchema<S> = S extends { _def: any } ? true : false

/**
 * Extract output type from schema, with proper handling for:
 * 1. Zod schemas (check _def, then extract from parse method)
 * 2. schemaOf schemas (also have _def, extract from replaced parse method)
 * 3. Other StandardSchema implementations (use StandardSchemaV1.InferOutput)
 */
export type InferSchemaOutput<ResponseSchema> =
  IsZodSchema<ResponseSchema> extends true
    ? // For Zod schemas (including schemaOf), extract from parse method to get correct type
      ResponseSchema extends { parse: infer ParseFn }
      ? ParseFn extends (...args: any[]) => infer R
        ? R
        : unknown
      : unknown
    : // For non-Zod schemas, use StandardSchema inference
      ResponseSchema extends StandardSchemaV1
      ? StandardSchemaV1.InferOutput<ResponseSchema>
      : unknown

export interface UploadStreamingEvent {
  /** Current data chunk being uploaded */
  chunk: Uint8Array
  /** Total bytes to upload (from Content-Length header or body size) */
  totalBytes: number | undefined
  /** Bytes already transferred */
  transferredBytes: number
}

export interface DownloadStreamingEvent {
  /** Current data chunk being downloaded */
  chunk: Uint8Array
  /** Total bytes to download (from Content-Length header, undefined if unknown) */
  totalBytes: number | undefined
  /** Bytes already transferred */
  transferredBytes: number
}

export type SerializeBody<TBody = unknown> = (
  body: TBody
) => BodyInit | null | undefined

export type SerializeParams = (params: RequestParamsType) => string

export type CustomFetch = typeof fetch
