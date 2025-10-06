import {
  HttpError,
  MiddlewareError,
  NetworkError,
  SchemaValidationError,
  SerializationError,
  TimeoutError,
} from './errors'
import { createSchemaValidator, type SchemaValidator } from './schema'
import type {
  CustomFetch,
  DownloadStreamingEvent,
  HttpMethod,
  RequestContext,
  RequestParamsType,
  ResponseType,
  RetryOptions,
  Schema,
  SerializeBody,
  SerializeParams,
  UploadStreamingEvent,
} from './types'
import {
  generatePath,
  toStreamableRequest,
  toStreamableResponse,
  type PathParams,
} from './utils'

/**
 * Default retry configuration for HTTP requests
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 300,
  backoffFactor: 2,
  retryStatusCodes: [429, 500, 502, 503, 504],
  retryNetworkErrors: true,
  maxRetryDelay: 30000,
  shouldRetry: () => true,
}

export interface HttpRequestOptions<
  TBody = unknown,
  TResponse = unknown,
  TParams extends RequestParamsType = RequestParamsType,
> {
  /** HTTP method */
  method?: HttpMethod
  /** Request headers */
  headers?: Record<string, string>
  /** Query parameters */
  params?: TParams
  /** Path parameters for URL template */
  pathParams?: Record<string, string | number>
  /** Request body */
  body?: TBody
  /** Response schema for validation */
  schema?: Schema<TResponse>
  /** Custom timeout for this request */
  timeout?: number
  /** AbortSignal for request cancellation */
  signal?: AbortSignal
  /** Fetch options */
  credentials?: RequestCredentials
  cache?: RequestCache
  mode?: RequestMode
  redirect?: RequestRedirect
  /** Upload streaming tracking for this specific request */
  onUploadStreaming?: (event: UploadStreamingEvent) => void
  /** Download streaming tracking for this specific request */
  onDownloadStreaming?: (event: DownloadStreamingEvent) => void
  /** Custom status validation */
  validateStatus?: (status: number) => boolean
  /** Response type override */
  responseType?: 'text' | 'blob' | 'arrayBuffer'
  /** Retry options for this specific request */
  retryOptions?: RetryOptions
}

export interface HttpClientConfig {
  /** Base URL for all requests */
  baseUrl?: string
  /** Default headers */
  headers?: Record<string, string>
  /** Default timeout */
  timeout?: number
  /** Schema validator */
  schemaValidator?: SchemaValidator
  /** Default retry options */
  retryOptions?: RetryOptions
  /** Custom fetch implementation */
  fetch?: CustomFetch
  /** Custom body serializer */
  serializeBody?: SerializeBody
  /** Custom params serializer */
  serializeParams?: SerializeParams
  /** Request middleware - can modify request before sending */
  onRequestMiddleware?: <TBody = unknown>(
    context: RequestContext<TBody>
  ) => RequestContext<TBody> | Promise<RequestContext<TBody>>
  /** Response middleware - can modify response after receiving */
  onResponseMiddleware?: (
    response: ResponseType<unknown>
  ) => ResponseType<unknown> | Promise<ResponseType<unknown>>
}

/**
 * Creates an HTTP request handler with the given configuration.
 * This is the core function that handles all HTTP requests with retry logic,
 * interceptors, streaming, and schema validation.
 */
export function createHttpRequest(config: HttpClientConfig = {}) {
  const {
    baseUrl = '',
    headers: defaultHeaders = {},
    timeout: defaultTimeout = 30_000,
    schemaValidator = createSchemaValidator(),
    fetch: customFetch = fetch,
    serializeBody: customSerializeBody,
    serializeParams: customSerializeParams,
    onRequestMiddleware,
    onResponseMiddleware,
  } = config

  return async function fetcher<
    Path extends string = string,
    TResponse = unknown,
    TBody = unknown,
    TParams extends RequestParamsType = RequestParamsType,
  >(
    url: Path,
    options: HttpRequestOptions<TBody, TResponse, TParams> = {}
  ): Promise<ResponseType<TResponse>> {
    const {
      method = 'GET',
      headers = {},
      params,
      pathParams,
      body,
      schema,
      timeout = defaultTimeout,
      signal,
      credentials,
      cache,
      mode,
      redirect,
      onUploadStreaming,
      onDownloadStreaming,
      validateStatus,
      responseType,
      retryOptions: requestRetryOptions,
    } = options

    let resolvedUrl = generatePath(url, pathParams as PathParams<Path>)
    if (baseUrl) {
      resolvedUrl = new URL(resolvedUrl, baseUrl).toString()
    }

    let requestContext: RequestContext<TBody> = {
      url: resolvedUrl,
      method,
      params,
      headers: new Headers({ ...defaultHeaders, ...headers }),
      body,
      signal,
      fetchOptions: { credentials, cache, mode, redirect },
    }

    if (onRequestMiddleware) {
      try {
        requestContext = await onRequestMiddleware(requestContext)
      } catch (error) {
        throw new MiddlewareError(
          createErrorMessage('Request middleware failed', error),
          'request',
          requestContext.url,
          requestContext.method,
          error instanceof Error ? error : undefined
        )
      }
    }

    if (requestContext.params) {
      const urlObj = new URL(requestContext.url)
      const serializedParams = customSerializeParams
        ? customSerializeParams(requestContext.params)
        : serializeQueryParams(requestContext.params)

      if (serializedParams) {
        const queryString =
          customSerializeParams && serializedParams.startsWith('?')
            ? serializedParams.slice(1)
            : serializedParams
        urlObj.search = queryString
      }

      requestContext.url = urlObj.toString()
    }

    const requestInit: RequestInit = {
      method: requestContext.method,
      headers: requestContext.headers,
      ...requestContext.fetchOptions,
    }

    if (
      requestContext.body !== undefined &&
      (requestContext.method === 'POST' ||
        requestContext.method === 'PUT' ||
        requestContext.method === 'PATCH')
    ) {
      let body: BodyInit
      let contentType: string | undefined

      if (customSerializeBody) {
        const serializedBody = customSerializeBody(requestContext.body)
        if (serializedBody == null) {
          body = ''
        } else {
          body = serializedBody

          if (
            isObjectLike(requestContext.body) &&
            typeof serializedBody === 'string' &&
            !requestContext.headers.has('content-type')
          ) {
            contentType = 'application/json'
          }
        }
      } else {
        const serialized = serializeRequestBody(requestContext.body)
        body = serialized.body
        contentType = serialized.contentType
      }

      requestInit.body = body

      if (contentType) {
        requestContext.headers.set('content-type', contentType)
      }

      ;(requestInit as any).duplex = 'half'
    }

    const mergedRetryOptions = {
      ...DEFAULT_RETRY_OPTIONS,
      ...config.retryOptions,
      ...requestRetryOptions,
    }
    const maxRetries = mergedRetryOptions.maxRetries
    let lastError: Error | undefined

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const finalSignal = requestContext.signal
        ? (() => {
            if (requestContext.signal && requestContext.signal.aborted) {
              return requestContext.signal
            }

            const combinedController = new AbortController()
            const cleanup = () => {
              clearTimeout(timeoutId)
              combinedController.abort()
            }

            requestContext.signal?.addEventListener('abort', cleanup)
            controller.signal.addEventListener('abort', cleanup)

            return combinedController.signal
          })()
        : controller.signal

      try {
        const request = new Request(requestContext.url, requestInit)
        const trackedRequest = onUploadStreaming
          ? await toStreamableRequest(request, onUploadStreaming)
          : request

        const response = await customFetch(trackedRequest.url, {
          method: trackedRequest.method,
          headers: trackedRequest.headers,
          body: trackedRequest.body,
          signal: finalSignal,
          ...requestContext.fetchOptions,
          ...(trackedRequest.body && { duplex: 'half' as const }),
        })

        const trackedResponse = onDownloadStreaming
          ? await toStreamableResponse(response, onDownloadStreaming)
          : response

        const responseData = await processResponse<TResponse>(
          trackedResponse,
          {
            validateStatus,
            schema,
            responseType,
          },
          method,
          requestContext.url,
          schemaValidator
        )

        if (onResponseMiddleware) {
          try {
            return (await onResponseMiddleware(
              responseData
            )) as ResponseType<TResponse>
          } catch (error) {
            throw new MiddlewareError(
              createErrorMessage('Response middleware failed', error),
              'response',
              requestContext.url,
              method,
              error instanceof Error ? error : undefined
            )
          }
        }

        return responseData
      } catch (error) {
        clearTimeout(timeoutId)
        lastError = error instanceof Error ? error : new Error(String(error))

        if (lastError.name === 'AbortError') {
          lastError = new TimeoutError(
            `Request timeout after ${timeout}ms`,
            lastError
          )
        }

        if (
          attempt < maxRetries &&
          (await shouldRetry(lastError, attempt, mergedRetryOptions))
        ) {
          const delay = calculateRetryDelay(attempt, mergedRetryOptions)
          await sleep(delay)
          continue
        }

        throw lastError
      }
    }

    throw lastError || new Error('Request failed')
  }
}

/**
 * Helper function to process response (extracted from HttpClient)
 */
async function processResponse<T>(
  response: Response,
  options: {
    validateStatus?: (status: number) => boolean
    schema?: Schema<T>
    responseType?: 'text' | 'blob' | 'arrayBuffer'
  },
  method: HttpMethod,
  url: string,
  schemaValidator: SchemaValidator
): Promise<ResponseType<T>> {
  const headers = Object.fromEntries(response.headers.entries())

  const validateStatus =
    options.validateStatus ||
    ((status: number) => status >= 200 && status < 300)

  let data: unknown
  try {
    if (options.responseType === 'text') {
      data = await response.text()
    } else if (options.responseType === 'blob') {
      data = await response.blob()
    } else if (options.responseType === 'arrayBuffer') {
      data = await response.arrayBuffer()
    } else {
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else if (contentType?.includes('text/')) {
        data = await response.text()
      } else {
        data = await response.arrayBuffer()
      }
    }
  } catch (error) {
    throw new SerializationError(
      createErrorMessage('Failed to parse response body', error),
      error instanceof Error ? error : undefined
    )
  }

  if (!validateStatus(response.status)) {
    throw new HttpError(
      `HTTP ${response.status} ${response.statusText}`,
      response.status,
      response.statusText,
      data,
      response,
      url,
      method
    )
  }

  const responseObj: ResponseType<T> = {
    data: data as T,
    status: response.status,
    statusText: response.statusText,
    headers,
    method,
    url,
    raw: response,
  }

  if (options.schema) {
    try {
      responseObj.data = schemaValidator.validate(
        options.schema,
        responseObj.data
      ) as T
    } catch (error) {
      throw new SchemaValidationError(
        `Schema validation failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        options.schema,
        responseObj.data,
        error instanceof Error ? error : undefined
      )
    }
  }

  return responseObj
}

/**
 * Determines if a request should be retried based on error type and retry configuration
 */
async function shouldRetry(
  error: Error,
  retryCount: number,
  retryOptions?: RetryOptions
): Promise<boolean> {
  if (!retryOptions) return false

  if (retryOptions.shouldRetry) {
    return await retryOptions.shouldRetry(error, retryCount)
  }

  if (error instanceof HttpError) {
    return retryOptions.retryStatusCodes?.includes(error.status) ?? false
  }

  if (error instanceof NetworkError || error.name === 'TypeError') {
    return retryOptions.retryNetworkErrors ?? false
  }

  return false
}

/**
 * Calculates the delay for the next retry attempt using exponential backoff
 */
function calculateRetryDelay(
  attempt: number,
  retryOptions?: RetryOptions
): number {
  if (!retryOptions) return 0

  const baseDelay = retryOptions.retryDelay ?? 300
  const backoffFactor = retryOptions.backoffFactor ?? 2
  const maxDelay = retryOptions.maxRetryDelay ?? 30000

  const delay = baseDelay * Math.pow(backoffFactor, attempt)
  return Math.min(delay, maxDelay)
}

function isObjectLike(
  value: any
): value is Record<string, any> | any[] | { toJSON(): any } {
  return (
    (value &&
      typeof value === 'object' &&
      value.constructor?.name === 'Object') ||
    Array.isArray(value) ||
    typeof value?.toJSON === 'function'
  )
}

function serializeQueryParams(params: RequestParamsType): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null) {
          searchParams.append(key, String(item))
        }
      }
    } else if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  }

  return searchParams.toString()
}

function serializeRequestBody(body: unknown): {
  body: BodyInit
  contentType?: string
} {
  if (
    typeof body === 'string' ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer ||
    body instanceof Blob ||
    body instanceof ReadableStream
  ) {
    return { body: body as BodyInit }
  }

  if (isObjectLike(body)) {
    return {
      body: JSON.stringify(body),
      contentType: 'application/json',
    }
  }

  return { body: body as BodyInit }
}

/**
 * Creates a standardized error message
 */
function createErrorMessage(context: string, error: unknown): string {
  return `${context}: ${error instanceof Error ? error.message : String(error)}`
}

/**
 * Creates a promise that resolves after the specified delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
