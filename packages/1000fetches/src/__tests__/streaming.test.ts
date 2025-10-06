import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createHttpClient } from '../client'

describe('HttpClient Streaming', () => {
  let client: ReturnType<typeof createHttpClient>
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    global.fetch = mockFetch
    client = createHttpClient({
      baseUrl: 'https://api.example.com',
    })
  })

  it('should call onUploadStreaming for request body streaming', async () => {
    const onUploadStreaming = vi.fn()
    const testData = { name: 'test file', content: 'test content' }

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    )

    await client.post('/upload', testData, {
      onUploadStreaming,
    })

    expect(onUploadStreaming).toHaveBeenCalled()
    const firstCallArg = onUploadStreaming.mock.calls[0][0]
    expect(firstCallArg).toEqual(
      expect.objectContaining({
        chunk: expect.any(Uint8Array),
        transferredBytes: expect.any(Number),
      })
    )
    // When Content-Length is absent, totalBytes is undefined (indeterminate upload size)
    expect(
      firstCallArg.totalBytes === undefined ||
        typeof firstCallArg.totalBytes === 'number'
    ).toBe(true)
  })

  it('should call onDownloadStreaming for response body streaming', async () => {
    const onDownloadStreaming = vi.fn()
    const responseBody = 'test response content'

    mockFetch.mockResolvedValueOnce(
      new Response(responseBody, {
        status: 200,
        headers: {
          'content-type': 'text/plain',
          'content-length': responseBody.length.toString(),
        },
      })
    )

    await client.get('/download', {
      onDownloadStreaming,
    })

    expect(onDownloadStreaming).toHaveBeenCalledWith(
      expect.objectContaining({
        chunk: expect.any(Uint8Array),
        totalBytes: responseBody.length,
        transferredBytes: expect.any(Number),
      })
    )
  })

  it('should work with global middleware', async () => {
    const onRequestMiddleware = vi.fn(context => {
      context.headers.set('X-Custom-Header', 'test')
      return context
    })
    const onResponseMiddleware = vi.fn(response => {
      return {
        ...response,
        data: { ...response.data, processed: true },
      }
    })

    const clientWithHooks = createHttpClient({
      baseUrl: 'https://api.example.com',
      onRequestMiddleware,
      onResponseMiddleware,
    })

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    )

    const result = await clientWithHooks.get('/test')

    expect(onRequestMiddleware).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('/test'),
        method: 'GET',
        headers: expect.any(Headers),
      })
    )
    expect(onResponseMiddleware).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 200,
        data: { data: 'test' },
      })
    )
    expect(result.data).toEqual({ data: 'test', processed: true })
  })

  it('should handle streaming errors gracefully', async () => {
    const onUploadStreaming = vi.fn()

    const clientWithHooks = createHttpClient({
      baseUrl: 'https://api.example.com',
    })

    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    await expect(
      clientWithHooks.post(
        '/upload',
        { data: 'test' },
        {
          onUploadStreaming,
        }
      )
    ).rejects.toThrow()
  })
})
