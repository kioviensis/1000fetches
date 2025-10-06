# Changelog

## 0.1.x

### Minor Changes

- Initial release of 1000fetches

  ## Features

#### Core HTTP Client

- **Type-safe HTTP methods** - GET, POST, PUT, PATCH, DELETE with full type safety
- **Compile-time path safety** - `:pathParam` validation at compile time, can't slip through undefined
- **Method-based API** - `api.get()`, `api.post()` with `.data()` extractor for clean code
- **Schema-driven validation** - Infer types at build time, verify data at runtime
- **Multi-schema support** - Zod, Valibot, Arktype, or any Standard Schema-compatible library
- **Request/response middleware** - Authentication, logging, transformations
- **Automatic retry logic** - Exponential backoff with jitter for resilient requests
- **Request cancellation** - Built-in AbortController integration
- **Timeout support** - Built-in timeout handling

#### Type Safety & Validation

- **Compile-time path validation** - TypeScript catches missing `:userId` parameters before runtime
- **Runtime schema validation** - Schemas verify data at the network boundary
- **Schema-based type inference** - Types inferred from schemas, no generics needed
- **Full TypeScript strict mode compliance** - Complete type safety
- **Path parameter type extraction** - Automatic type inference for path parameters
- **Generic response types** - Full type inference for responses

#### Request & Response Handling

- **Automatic response parsing** - JSON/text responses parsed automatically
- **Smart data extraction** - Chain `.data()` for direct value access without `.data` property
- **Custom response types** - Support for text, blob, arrayBuffer response types
- **Request body serialization** - Automatic JSON serialization for objects
- **Query parameter handling** - Automatic query parameter serialization
- **Header management** - Default headers and per-request header overrides

#### Body Types Support

- **JSON objects** - Automatic serialization and parsing
- **FormData** - Native support for file uploads
- **Blob and ArrayBuffer** - Binary data support
- **URLSearchParams** - Form encoding support
- **Custom body serialization** - Extensible body handling
- **Custom params serialization** - Customize query parameter serialization
- **Custom fetch implementation** - Use custom fetch implementations (Node.js, custom adapters)

#### Streaming & Progress

- **Real-time streaming** - Access actual data chunks during upload/download
- **Upload progress tracking** - `onUploadStreaming` with chunk, transferredBytes, totalBytes
- **Download progress tracking** - `onDownloadStreaming` with real-time progress
- **Chunk-based processing** - Process data in chunks during streaming
- **Progress callbacks** - Real-time progress updates with actual chunk data

#### Error Handling

- **Structured error types** - HttpError, NetworkError, TimeoutError, MiddlewareError, PathParameterError
- **Detailed error context** - Status, method, URL, data in error objects
- **Type-safe error handling** - instanceof checks for different error types
- **Custom status validation** - `validateStatus` function for custom error handling
- **Error middleware** - Custom error processing and transformation

#### Production Features

- **Smart retry logic** - Exponential backoff with jitter for resilient requests
- **Timeout and cancellation** - Built-in AbortController integration
- **Request/Response middleware** - Full middleware support for authentication, logging, transformations
- **Minimalistic footprint** - Enterprise features without the bloat
- **Zero dependencies** - Optional peer dependencies, tree-shakable builds

#### Developer Experience

- **Method-based API** - Intuitive `api.get()`, `api.post()` methods
- **Data extractor** - `.data()` method for direct value access
- **TypeScript-first** - Full type inference and IntelliSense support
- **Comprehensive API reference** - Complete documentation of all options
- **IDE support** - Full JSDoc comments for IntelliSense

#### Configuration & Customization

- **Client configuration** - Base URL, default headers, timeout, retry options
- **Dynamic authentication** - Async token retrieval in middleware
- **Custom schema validators** - Support for any Standard Schema library
- **Request middleware** - Transform requests before sending
- **Response middleware** - Transform responses after receiving
- **Per-request overrides** - Override any default setting per request
