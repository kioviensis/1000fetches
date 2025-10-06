import type { DownloadStreamingEvent, UploadStreamingEvent } from '../types'

function createStreamingStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (
    chunk: Uint8Array,
    totalBytes: number | undefined,
    transferredBytes: number
  ) => void,
  totalBytes: number | undefined
): ReadableStream<Uint8Array> {
  let transferredBytes = 0

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          transferredBytes += value.length
          onChunk(value, totalBytes, transferredBytes)
          controller.enqueue(value)
        }
      } finally {
        reader.releaseLock()
        controller.close()
      }
    },
  })
}

/**
 * Creates a request with upload streaming tracking
 */
export async function toStreamableRequest(
  request: Request,
  onUploadStreaming?: (event: UploadStreamingEvent) => void
): Promise<Request> {
  if (!onUploadStreaming || !request.body) {
    return request
  }

  const reader = request.body.getReader()
  const totalBytes = request.headers.get('content-length')
    ? parseInt(request.headers.get('content-length') || '0', 10)
    : undefined

  const stream = createStreamingStream(
    reader,
    (chunk, totalBytes, transferredBytes) => {
      onUploadStreaming({
        chunk,
        totalBytes,
        transferredBytes,
      })
    },
    totalBytes
  )

  return new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: stream,
    signal: request.signal,
    credentials: request.credentials,
    cache: request.cache,
    mode: request.mode,
    redirect: request.redirect,
    referrer: request.referrer,
    referrerPolicy: request.referrerPolicy,
    integrity: request.integrity,
    keepalive: request.keepalive,
    duplex: 'half',
  } as RequestInit)
}

/**
 * Creates a response with download streaming tracking
 */
export async function toStreamableResponse(
  response: Response,
  onDownloadStreaming?: (event: DownloadStreamingEvent) => void
): Promise<Response> {
  if (!onDownloadStreaming || !response.body) {
    return response
  }

  const reader = response.body.getReader()
  const totalBytes = response.headers.get('content-length')
    ? parseInt(response.headers.get('content-length') || '0', 10)
    : undefined

  const stream = createStreamingStream(
    reader,
    (chunk, totalBytes, transferredBytes) => {
      onDownloadStreaming({
        chunk,
        totalBytes,
        transferredBytes,
      })
    },
    totalBytes
  )

  return new Response(stream, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}
