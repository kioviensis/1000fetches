import type { HttpClientConfig, HttpRequestOptions } from './core'
import { createHttpRequest } from './core'
import { InvalidBaseUrlError } from './errors'
import type {
  EnforcedPathParamsOptions,
  InferSchemaOutput,
  RequestParamsType,
  ResponseType,
  Schema,
  SchemaInferredRequestOptions,
} from './types'
import type { HasRequiredParams } from './utils'

function validateAndNormalizeBaseUrl(baseUrl?: string): string {
  const hasLocation =
    typeof window !== 'undefined' &&
    typeof window.location !== 'undefined' &&
    window.location.origin !== 'null'

  if (!baseUrl) {
    // In browser environment, default to location.origin for relative paths
    return hasLocation ? window.location.origin : ''
  }

  if (baseUrl.startsWith('/')) {
    // In Node.js or non-browser environments, relative paths are preserved as-is
    return hasLocation
      ? new URL(baseUrl, window.location.origin).href.replace(/\/$/, '')
      : baseUrl.replace(/\/$/, '')
  }

  try {
    new URL(baseUrl)
  } catch {
    throw new InvalidBaseUrlError(
      `Invalid baseUrl: "${baseUrl}". Must be a valid absolute URL or relative path starting with "/".`,
      baseUrl
    )
  }

  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
}

type ResponsePromise<T> = Promise<ResponseType<T>> & {
  data(): Promise<T>
}

/**
 * Wraps a response promise to add the .data() method
 */
function wrapResponsePromise<T>(
  promise: Promise<ResponseType<T>>
): ResponsePromise<T> {
  const wrappedPromise = promise as ResponsePromise<T>
  wrappedPromise.data = async () => {
    const response = await promise
    return response.data
  }
  return wrappedPromise
}

/**
 * Creates a complete HTTP client with method builders
 */
export function createHttpClient(config: HttpClientConfig = {}) {
  const validatedConfig = {
    ...config,
    baseUrl: validateAndNormalizeBaseUrl(config.baseUrl),
  }

  const requestHandler = createHttpRequest(validatedConfig)

  function get<
    ResponseSchema extends Schema,
    Path extends string = string,
    TParams extends RequestParamsType = RequestParamsType,
  >(
    url: Path,
    options: SchemaInferredRequestOptions<
      never,
      InferSchemaOutput<ResponseSchema>,
      TParams,
      Path
    > & {
      schema: ResponseSchema
    }
  ): ResponsePromise<InferSchemaOutput<ResponseSchema>>

  function get<
    Path extends string = string,
    TResponse = unknown,
    TParams extends RequestParamsType = RequestParamsType,
  >(
    url: Path,
    ...args: HasRequiredParams<Path> extends true
      ? [options: EnforcedPathParamsOptions<never, TResponse, TParams, Path>]
      : [options?: EnforcedPathParamsOptions<never, TResponse, TParams, Path>]
  ): ResponsePromise<TResponse>

  function get<
    Path extends string = string,
    TResponse = unknown,
    TParams extends RequestParamsType = RequestParamsType,
  >(url: Path, ...args: any[]) {
    return wrapResponsePromise(
      requestHandler<Path, TResponse, never, TParams>(url, {
        ...(args[0] ?? {}),
        method: 'GET',
      })
    )
  }

  return {
    get,

    post: <
      Path extends string = string,
      TResponse = unknown,
      TBody = unknown,
      TParams extends RequestParamsType = RequestParamsType,
    >(
      url: Path,
      body?: TBody,
      ...args: HasRequiredParams<Path> extends true
        ? [options: EnforcedPathParamsOptions<TBody, TResponse, TParams, Path>]
        : [options?: EnforcedPathParamsOptions<TBody, TResponse, TParams, Path>]
    ) =>
      wrapResponsePromise(
        requestHandler<Path, TResponse, TBody, TParams>(url, {
          ...(args[0] ?? {}),
          method: 'POST',
          body,
        })
      ),

    put: <
      Path extends string = string,
      TResponse = unknown,
      TBody = unknown,
      TParams extends RequestParamsType = RequestParamsType,
    >(
      url: Path,
      body?: TBody,
      ...args: HasRequiredParams<Path> extends true
        ? [options: EnforcedPathParamsOptions<TBody, TResponse, TParams, Path>]
        : [options?: EnforcedPathParamsOptions<TBody, TResponse, TParams, Path>]
    ) =>
      wrapResponsePromise(
        requestHandler<Path, TResponse, TBody, TParams>(url, {
          ...(args[0] ?? {}),
          method: 'PUT',
          body,
        })
      ),

    patch: <
      Path extends string = string,
      TResponse = unknown,
      TBody = unknown,
      TParams extends RequestParamsType = RequestParamsType,
    >(
      url: Path,
      body?: TBody,
      ...args: HasRequiredParams<Path> extends true
        ? [options: EnforcedPathParamsOptions<TBody, TResponse, TParams, Path>]
        : [options?: EnforcedPathParamsOptions<TBody, TResponse, TParams, Path>]
    ) =>
      wrapResponsePromise(
        requestHandler<Path, TResponse, TBody, TParams>(url, {
          ...(args[0] ?? {}),
          method: 'PATCH',
          body,
        })
      ),

    delete: <
      Path extends string = string,
      TResponse = unknown,
      TParams extends RequestParamsType = RequestParamsType,
    >(
      url: Path,
      ...args: HasRequiredParams<Path> extends true
        ? [options: EnforcedPathParamsOptions<never, TResponse, TParams, Path>]
        : [options?: EnforcedPathParamsOptions<never, TResponse, TParams, Path>]
    ) =>
      wrapResponsePromise(
        requestHandler<Path, TResponse, never, TParams>(url, {
          ...(args[0] ?? {}),
          method: 'DELETE',
        })
      ),

    /**
     * Generic request method for custom HTTP methods and full control
     * Similar to native fetch but with 1000fetches features
     */
    request: <
      Path extends string = string,
      TResponse = unknown,
      TBody = unknown,
      TParams extends RequestParamsType = RequestParamsType,
    >(
      url: Path,
      options?: HttpRequestOptions<TBody, TResponse, TParams>
    ) =>
      wrapResponsePromise(
        requestHandler<Path, TResponse, TBody, TParams>(url, options)
      ),
  }
}

export const http = createHttpClient()
