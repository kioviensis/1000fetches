interface HttpClientError {
  name: string
  message: string
  cause?: Error
  stack?: string
}

export class HttpError<TErrorData = unknown>
  extends Error
  implements HttpClientError
{
  public readonly name = 'HttpError'
  public readonly status: number
  public readonly statusText: string
  public readonly data: TErrorData
  public readonly response: Response
  public readonly url: string
  public readonly method: string
  public override readonly cause?: Error

  constructor(
    message: string,
    status: number,
    statusText: string,
    data: TErrorData,
    response: Response,
    url: string,
    method: string,
    cause?: Error
  ) {
    const enhancedMessage = `HTTP ${status} ${statusText}: ${message} (${method} ${url})`
    super(enhancedMessage, { cause })
    this.status = status
    this.statusText = statusText
    this.data = data
    this.response = response
    this.url = url
    this.method = method
  }
}

export class NetworkError extends Error implements HttpClientError {
  public readonly name = 'NetworkError'
  public override readonly cause?: Error

  constructor(message: string, cause?: Error) {
    super(message, { cause })
  }
}

export class SchemaValidationError extends Error implements HttpClientError {
  public readonly name = 'SchemaValidationError'
  public readonly schema: unknown
  public readonly data: unknown
  public override readonly cause?: Error

  constructor(message: string, schema: unknown, data: unknown, cause?: Error) {
    super(message, { cause })
    this.schema = schema
    this.data = data
  }
}

export class TimeoutError extends Error implements HttpClientError {
  public readonly name = 'TimeoutError'
  public override readonly cause?: Error

  constructor(message: string, cause?: Error) {
    super(message, { cause })
  }
}

export class PathParameterError extends Error implements HttpClientError {
  public readonly name = 'PathParameterError'
  public readonly url: string
  public readonly requiredParams: string[]
  public readonly providedParams: string[]
  public override readonly cause?: Error

  constructor(
    message: string,
    url: string,
    requiredParams: string[],
    providedParams: string[],
    cause?: Error
  ) {
    super(message, { cause })
    this.url = url
    this.requiredParams = requiredParams
    this.providedParams = providedParams
  }
}

export class MiddlewareError extends Error implements HttpClientError {
  public readonly name = 'MiddlewareError'
  public readonly interceptorType: 'request' | 'response'
  public readonly url?: string
  public readonly method?: string
  public override readonly cause?: Error

  constructor(
    message: string,
    interceptorType: 'request' | 'response',
    url?: string,
    method?: string,
    cause?: Error
  ) {
    super(message, { cause })
    this.interceptorType = interceptorType
    this.url = url
    this.method = method
  }
}

export class SerializationError extends Error implements HttpClientError {
  public readonly name = 'SerializationError'
  public override readonly cause?: Error

  constructor(message: string, cause?: Error) {
    super(message, { cause })
  }
}

export class InvalidSchemaError extends Error implements HttpClientError {
  public readonly name = 'InvalidSchemaError'
  public readonly schema: unknown
  public override readonly cause?: Error

  constructor(message: string, schema: unknown, cause?: Error) {
    super(message, { cause })
    this.schema = schema
  }
}

export class AsyncSchemaValidationError
  extends Error
  implements HttpClientError
{
  public readonly name = 'AsyncSchemaValidationError'
  public readonly schema: unknown
  public override readonly cause?: Error

  constructor(message: string, schema: unknown, cause?: Error) {
    super(message, { cause })
    this.schema = schema
  }
}

export class InvalidBaseUrlError extends Error implements HttpClientError {
  public readonly name = 'InvalidBaseUrlError'
  public readonly baseUrl: string
  public override readonly cause?: Error

  constructor(message: string, baseUrl: string, cause?: Error) {
    super(message, { cause })
    this.baseUrl = baseUrl
  }
}
