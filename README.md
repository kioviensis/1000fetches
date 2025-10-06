# 1000fetches

_Type-first HTTP client with schema validation, compile-time path safety, and streaming_
<br/>

[![npm version](https://img.shields.io/npm/v/1000fetches?style=flat-square)](https://www.npmjs.com/package/1000fetches)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
> Built for the 1000th call to be as safe as the first


### The problem

You start with `fetch`, then add a wrapper for error handling.
Then generics. Then path params. Then retries and timeouts.
Soon every project grows its own version — slightly different, equally fragile.

Alternatives? Tiny helpers that stop halfway,
or heavy Axios-style clients that add weight without type guarantees.

---

### The idea

A type-first HTTP client that unifies validation, retries, streaming, and middleware on top of native `fetch`.
<br/>
No magic, no layers of indirection. Just a single, explicit API that makes every request verifiably safe.

---

### The claim

> Schema-powered Fetch 2.0 — where types meet runtime reality

The point where TypeScript inference, runtime validation, and minimal design converge.

---

### Highlights

- 🧭 **Compile-time path safety** — `:pathParam` can't slip through undefined
- 🧩 **Schema-driven validation** — infer types at build time, verify data at runtime
- ⚡ **Native streaming** — observe, transform, or pipe data chunks as they flow
- 🔁 **Retries, timeouts, middleware** — production essentials, zero config
- 🎯 **Method-based API** — `api.get()`, `api.post()` with `.data()` extractor for clean code
- 🧠 **Designed for flow** — clear API, predictable behavior, no hidden magic
---

## Quickstart

```bash
npm install 1000fetches
```

```ts
import { createHttpClient } from '1000fetches'
import { z } from 'zod'

// Create client
const api = createHttpClient({
  baseUrl: 'https://api.example.com',
})

// Type-safe request with path params
const userResponse = await api.get('/users/:id', {
  pathParams: { id: '123' },
  schema: z.object({ name: z.string() }),
})
// user.data 👉 { name: string }

// Extractor
const user = await api
    .get('/users/:id', {
        pathParams: { id: '123' },
        schema: z.object({ name: z.string() }),
    })
    .data() // Returns Promise<{ name: string }> directly, skipping the .data property
```

**Or use the default client for quick requests:**

```ts
import http from '1000fetches'

const user = await http.get('/users/:id', {
  pathParams: { id: '123' },
  schema: userSchema,
})
```

## ➡️ Key Features

### ✔️ Type Safety That Actually Works

- **Compile-time path validation** — TypeScript catches missing `:userId` parameters before runtime
- **Runtime schema validation** — Schemas verify data at the network boundary
- **Schema-based type inference** — Types inferred from schemas, no generics needed
- **Multi-schema support** — [Zod](https://github.com/colinhacks/zod), [Valibot](https://github.com/fabian-hiller/valibot), [ArkType](https://github.com/arktypeio/arktype), or any [Standard Schema](https://github.com/standard-schema/standard-schema)-compatible library

### ✔️ Production-Ready Quality

- **Smart retry logic** — Exponential backoff with jitter for resilient requests
- **Timeout and cancellation support** — Built-in `AbortController` integration
- **Structured error handling** — `HttpError`, `NetworkError`, `TimeoutError` with full context
- **Request/Response middleware** — Authentication, logging, transformations
- **Minimalistic footprint** — Enterprise features without the bloat

### ✔️ Engineer-Friendly DX

- **Method-based API** — `api.get()`, `api.post()` with full type safety
- **Automatic response parsing** — JSON/text responses parsed automatically
- **Smart data extraction** — Chain `.data()` for direct value access without `.data` property
- **Real-time streaming** — Access actual data chunks during upload/download
- **Zero dependencies** — Optional peer dependencies, tree-shakable builds
- **TypeScript-first** — Full type inference and `IntelliSense` support

**1000fetches** combines native `fetch` performance with enterprise-grade features and bulletproof type safety.

## ➡️ Usage Examples

### Authentication

```ts
const api = createHttpClient({
  baseUrl: 'https://api.example.com',
  headers: { Authorization: `Bearer ${token}` },
})

// Or dynamic auth
const api = createHttpClient({
  baseUrl: 'https://api.example.com',
  onRequestMiddleware: async context => {
    const token = await getToken()
    context.headers.set('Authorization', `Bearer ${token}`)
    return context
  },
})
```

### Streaming

```ts
// Upload progress with actual data chunks
await api.post('/api/files', fileData, {
  onUploadStreaming: ({ chunk, transferredBytes, totalBytes }) => {
    const progress = Math.round((transferredBytes / totalBytes) * 100)
    console.log(`Uploading: ${progress}% - chunk size: ${chunk.length} bytes`)
  },
})

// Download progress
await api.get('/api/files/:id', {
  pathParams: { id: '123' },
  onDownloadStreaming: ({ chunk, transferredBytes, totalBytes }) => {
    const progress = Math.round((transferredBytes / totalBytes) * 100)
    console.log(`Downloading: ${progress}% - chunk size: ${chunk.length} bytes`)
  },
})
```

### Error Handling

```ts
import { HttpError, NetworkError, TimeoutError, MiddlewareError, PathParameterError } from '1000fetches'

try {
  const user = await api.get('/users/:id', {
    pathParams: { id: '123' },
    schema: userSchema,
  })
} catch (error) {
  if (error instanceof HttpError) {
    console.log(`HTTP ${error.status}: ${error.statusText}`)
  } else if (error instanceof NetworkError) {
    console.log('Network error:', error.message)
  } else if (error instanceof TimeoutError) {
    console.log('Request timed out')
  } else if (error instanceof MiddlewareError) {
    console.log('Middleware error:', error.message)
  } else if (error instanceof PathParameterError) {
    console.log('Path parameter error:', error.message)
  }
}
```

## API Reference

### <samp>createHttpClient(config?)</samp>

Creates a new HTTP client with optional configuration.

```ts
function createHttpClient(config?: HttpClientConfig): HttpClient
```

**Configuration Options:**

| Option                        | Type                                    | Description                           |
| ----------------------------- | --------------------------------------- | ------------------------------------- |
| `baseUrl`                     | `string`                                | Base URL for all requests             |
| `headers`                     | `Record<string, string>`                | Default headers                       |
| `timeout`                     | `number`                                | Default timeout in milliseconds       |
| `retryOptions`                | `RetryOptions`                          | Default retry configuration           |
| `onRequestMiddleware`         | `(context: RequestContext) => RequestContext` | Request middleware                    |
| `onResponseMiddleware`        | `(response: ResponseType) => ResponseType` | Response middleware                   |
| `schemaValidator`             | `SchemaValidator`                      | Custom schema validator               |

### <samp>HTTP Methods</samp>

All HTTP methods support the same options:

```ts
await api.get('/users/:id', {
  pathParams: { id: '123' },
  schema: userSchema,
})

// POST
await api.post('/users', userData, {
  schema: userSchema,
})

// PUT
await api.put('/users/:id', userData, {
  pathParams: { id: '123' },
  schema: userSchema,
})

// PATCH
await api.patch('/users/:id', partialData, {
  pathParams: { id: '123' },
  schema: userSchema,
})

// DELETE
await api.delete('/users/:id', {
  pathParams: { id: '123' },
})
```

### <samp>Request Options</samp>

| Option                        | Type                                    | Description                           |
| ----------------------------- | --------------------------------------- | ------------------------------------- |
| `pathParams`                  | `Record<string, string \| number>`      | Path parameters for URL templates     |
| `params`                      | `Record<string, string \| number \| boolean \| undefined>` | Query parameters                      |
| `headers`                     | `Record<string, string>`                | Request headers                       |
| `body`                        | `any`                                   | Request body                          |
| `schema`                      | `Schema`                                | Response validation schema            |
| `timeout`                     | `number`                                | Request timeout                       |
| `signal`                      | `AbortSignal`                          | Request cancellation signal           |
| `validateStatus`              | `(status: number) => boolean`           | Custom status validation              |
| `responseType`                | `'text' \| 'blob' \| 'arrayBuffer'`     | Response type override                |
| `cache`                       | `RequestCache`                          | Cache mode                            |
| `credentials`                 | `RequestCredentials`                    | Credentials mode                      |
| `mode`                        | `RequestMode`                           | Request mode                          |
| `redirect`                    | `RequestRedirect`                       | Redirect mode                         |
| `retryOptions`                | `RetryOptions`                         | Retry configuration                   |
| `onUploadStreaming`           | `(event: UploadStreamingEvent) => void` | Upload streaming callback             |
| `onDownloadStreaming`         | `(event: DownloadStreamingEvent) => void` | Download streaming callback           |

### <samp>Response Object</samp>

All requests return a `ResponseType<T>` object:

```ts
interface ResponseType<T> {
  data: T // Parsed response data
  status: number // HTTP status code
  statusText: string // HTTP status text
  headers: Record<string, string> // Response headers
  method: HttpMethod // HTTP method used
  url: string // Final URL
  raw: Response // Raw fetch Response
}
```

### <samp>Data Extractor</samp>

For convenience, you can extract data directly:

```ts
const user = await api
  .get('/users/:id', {
    pathParams: { id: '123' },
    schema: userSchema,
  })
  .data() // Returns Promise<User> instead of ResponseType<User>
```

## ➡️ Feature Comparison

**1000fetches vs Popular Alternatives**

| Feature               | 1000fetches       | Axios           | Better-fetch       | Up-fetch           | Native Fetch       |
| --------------------- | ----------------- | --------------- | ------------------ | ------------------ | ------------------ |
| **Bundle Size (gz)**  | ≈4.3 kB           | ≈14.75 kB       | ≈3.07 kB           | ≈1.6 kB            | 0 kB               |
| **TypeScript**        | ✅ Full inference | ⚠️ Limited      | ⚠️ Limited         | ✅ Good            | ❌ Manual          |
| **Path Params**       | ✅ Compile-time   | ❌ Manual       | ❌ Manual          | ❌ Manual          | ❌ Manual          |
| **Schema Validation** | ✅ Multi-library  | ❌ None         | ⚠️ Limited         | ✅ Multi-library   | ❌ None            |
| **Retry Logic**       | ✅ Built-in       | ✅ Built-in     | ❌ Manual          | ✅ Built-in        | ❌ Manual          |
| **Error Handling**    | ✅ Structured     | ✅ Good         | ⚠️ Basic           | ✅ Good            | ⚠️ Verbose         |
| **Middleware**        | ✅ Full support   | ✅ Full support | ⚠️ Limited         | ✅ Lifecycle hooks | ❌ None            |
| **Streaming**         | ✅ Real chunks    | ❌ None         | ❌ None            | ✅ Real chunks     | ✅ Native          |
| **API Design**        | ✅ Method-based   | ✅ Method-based | ❌ Single function | ❌ Single function | ❌ Single function |
| **Tree Shaking**      | ✅ Good           | ⚠️ Partial      | ✅ Good            | ✅ Perfect         | ✅                 |

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

<div align="center">

**Built for developers who believe type safety shouldn't be optional.**
**Because your backend deserves skepticism.**

</div>

<!-- Links -->

[zod]: https://zod.dev/
[valibot]: https://valibot.dev/
[arktype]: https://arktype.dev/
[standard-schema]: https://github.com/standard-schema/standard-schema
