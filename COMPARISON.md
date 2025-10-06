# Feature Comparison

_This table aims to provide an accurate comparison of fetch libraries, though there may be room for improvement. If you notice any discrepancies or have additional information to share, please submit a PR with supporting documentation._

## 1000fetches vs up-fetch vs ofetch vs wretch vs ky

**1000fetches** is a modern HTTP client that focuses on **compile-time safety** and **method-based APIs**, while other libraries prioritize different approaches.

Legend:

- ✅ Supported
- 🟧 Partially supported
- ❌ Not supported or not documented

| Feature                       | [1000fetches][1000fetches]                         | [up-fetch][up-fetch]                               | [ofetch][ofetch]                               | [wretch][wretch]                               | [ky][ky]                               |
| ----------------------------- | -------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------- | -------------------------------------- |
| Minzipped Size                | [![][1000fetches-size-badge]][1000fetches-size-link] | [![][up-fetch-size-badge]][up-fetch-size-link]     | [![][ofetch-size-badge]][ofetch-size-link]     | [![][wretch-size-badge]][wretch-size-link]     | [![][ky-size-badge]][ky-size-badge]     |
| GitHub Issues                 | [![][1000fetches-issues-badge]][1000fetches-issues-link] | [![][up-fetch-issues-badge]][up-fetch-issues-link] | [![][ofetch-issues-badge]][ofetch-issues-link] | [![][wretch-issues-badge]][wretch-issues-link] | [![][ky-issues-badge]][ky-issues-link] |
| **TypeScript Features**       |                                                    |                                                    |                                                |                                                |                                        |
| Full Type Inference           | ✅                                                 | ✅                                                 | ⚠️ Limited                                      | ⚠️ Limited                                      | ❌ Manual  |
| Compile-time Path Validation  | ✅                                                 | ❌                                                 | ❌                                             | ❌                                             | ❌         |
| Schema-based Types            | ✅                                                 | ✅                                                 | ❌                                             | ❌                                             | ❌         |
| **Core Features**             |                                                    |                                                    |                                                |                                                |                                        |
| Automatic Body Handling       | ✅                                                 | ✅                                                 | ✅                                             | ✅                                             | ✅         |
| Automatic Params Handling     | ✅                                                 | ✅                                                 | ✅                                             | ✅                                             | ✅         |
| Automatic Response Parsing    | ✅                                                 | ✅                                                 | ✅                                             | ✅                                             | ✅         |
| Custom Body Serializer        | ✅                                                 | ✅                                                 | ❌                                             | ❌                                             | ❌         |
| Custom Error Parser           | ✅                                                 | ✅                                                 | ❌                                             | 🟧                                             | ❌         |
| Custom Error Throwing         | ✅                                                 | ✅                                                 | ❌                                             | ❌                                             | ✅         |
| Custom Fetch Implementation   | ✅                                                 | ✅                                                 | ❌                                             | ❌                                             | 🟧 (1)     |
| Custom Params Serializer      | ✅                                                 | ✅                                                 | ❌                                             | ❌                                             | ❌         |
| Custom Response Parser        | ✅                                                 | ✅                                                 | ✅                                             | 🟧                                             | 🟧         |
| Dynamic Default Headers       | ✅                                                 | ✅                                                 | 🟧                                             | 🟧                                             | 🟧         |
| Extendable instance           | ✅                                                 | ❌                                                 | ❌                                             | ✅                                             | ✅         |
| Hooks/Middleware            | ✅                                                 | ✅                                                 | ✅                                             | ✅                                             | ✅         |
| Instance Configuration        | ✅                                                 | ✅                                                 | ✅                                             | ✅                                             | ✅         |
| Retry                         | ✅                                                 | ✅                                                 | ✅                                             | ✅                                             | ✅         |
| Request Streaming & Progress  | ✅                                                 | ✅                                                 | ❌                                             | ❌                                             | ✅         |
| Response Streaming & Progress | ✅                                                 | ✅                                                 | ❌                                             | ✅                                             | ✅         |
| Schema Validation             | ✅                                                 | ✅                                                 | ❌                                             | ❌                                             | ❌         |
| Timeout                       | ✅                                                 | ✅                                                 | 🟧 (2)                                         | ✅                                             | ✅         |
| Zero Dependencies             | ✅                                                 | ✅                                                 | ❌                                             | ✅                                             | ✅         |
| **API Design**                |                                                    |                                                    |                                                |                                                |                                        |
| Method Builders (get/post/etc)| ✅                                                 | ❌                                                 | ❌                                             | ✅                                             | ✅         |
| Single Function API           | ❌                                                 | ✅                                                 | ✅                                             | ❌                                             | ❌         |
| Path Parameter Enforcement   | ✅                                                 | ❌                                                 | ❌                                             | ❌                                             | ❌         |
| **Error Handling**            |                                                    |                                                    |                                                |                                                |                                        |
| Structured Errors             | ✅                                                 | ✅                                                 | ⚠️ Basic                                       | ✅                                             | ⚠️ Verbose |
| Validation Errors              | ✅                                                 | ✅                                                 | ❌                                             | ❌                                             | ❌         |
| Network Errors                | ✅                                                 | ✅                                                 | ⚠️ Basic                                       | ✅                                             | ⚠️ Verbose |
| **Performance**                |                                                    |                                                    |                                                |                                                |                                        |
| Tree Shaking                  | ✅ Good                                             | ✅ Perfect                                         | ⚠️ Partial                                      | ✅ Good                                        | ✅         |
| Bundle Size                   | ≈3.4 kB                                            | ≈1.6 kB                                            | ≈2.1 kB                                        | ≈3.1 kB                                        | ≈2.8 kB    |

(1) fetch type is not inferred
(2) timeout can't be used together with signal as per ofetch 1.4.1

## Key Differentiators

### 1000fetches Advantages
- **Compile-time path validation** - TypeScript catches missing path parameters before runtime
- **Method-based API** - Cleaner API with dedicated HTTP method builders (`api.get()`, `api.post()`, etc.)
- **Comprehensive error handling** - Structured errors with full context
- **Enterprise features** - Built-in retry logic, middleware, streaming support
- **Better TypeScript integration** - Full type inference without generics
- **Real-time streaming** - Access actual data chunks during upload/download

### up-fetch Advantages
- **Smaller bundle size** - 1.6kB vs 3.4kB
- **Single function API** - Simpler mental model for some use cases
- **More established** - Higher adoption and community
- **Perfect tree shaking** - Better optimization

### When to Choose Each Library

**Choose 1000fetches if:**
- You need compile-time path parameter validation
- You prefer method-based APIs (get, post, put, etc.)
- You need comprehensive error handling and enterprise features
- You want perfect TypeScript integration
- You need real-time data streaming capabilities
- Bundle size is not critical (3.4kB vs 1.6kB)

**Choose up-fetch if:**
- Bundle size is critical
- You prefer a single function API
- You want a more established library with larger community
- You need perfect tree shaking
- You don't need compile-time path validation

**Choose ofetch if:**
- You're using Nuxt.js or other UnJS tools
- You need SSR-specific features
- You want a Vue.js ecosystem integration

Both libraries are excellent choices for modern TypeScript applications with schema validation needs.

<!-- libs -->

[ky]: https://github.com/sindresorhus/ky
[ofetch]: https://github.com/unjs/ofetch
[wretch]: https://github.com/elbywan/wretch
[up-fetch]: https://github.com/L-Blondy/up-fetch
[1000fetches]: https://github.com/your-username/1000fetches

<!-- badges -->

[1000fetches-size-badge]: https://img.shields.io/bundlephobia/minzip/1000fetches?label=
[1000fetches-size-link]: https://bundlephobia.com/package/1000fetches
[1000fetches-issues-badge]: https://img.shields.io/github/issues/your-username/1000fetches?label=
[1000fetches-issues-link]: https://github.com/your-username/1000fetches/issues
[up-fetch-size-badge]: https://img.shields.io/bundlephobia/minzip/up-fetch?label=
[up-fetch-size-link]: https://bundlephobia.com/package/up-fetch
[up-fetch-issues-badge]: https://img.shields.io/github/issues/L-Blondy/up-fetch?label=
[up-fetch-issues-link]: https://github.com/L-Blondy/up-fetch/issues
[ofetch-size-badge]: https://img.shields.io/bundlephobia/minzip/ofetch?label=
[ofetch-size-link]: https://bundlephobia.com/package/ofetch
[ofetch-issues-badge]: https://img.shields.io/github/issues/unjs/ofetch?label=
[ofetch-issues-link]: https://github.com/unjs/ofetch/issues
[wretch-size-badge]: https://img.shields.io/bundlephobia/minzip/wretch?label=
[wretch-size-link]: https://bundlephobia.com/package/wretch
[wretch-issues-badge]: https://img.shields.io/github/issues/elbywan/wretch?label=
[wretch-issues-link]: https://github.com/elbywan/wretch/issues
[ky-size-badge]: https://img.shields.io/bundlephobia/minzip/ky?label=
[ky-size-link]: https://bundlephobia.com/package/ky
[ky-issues-badge]: https://img.shields.io/github/issues/sindresorhus/ky?label=
[ky-issues-link]: https://github.com/sindresorhus/ky/issues
