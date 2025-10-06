# Best Practices Guide

This guide provides recommendations for using 1000fetches effectively in production applications.

## Table of Contents

- [Client Configuration](#client-configuration)
- [Error Handling](#error-handling)
- [Schema Validation](#schema-validation)
- [Middleware](#middleware)
- [Performance Optimization](#performance-optimization)
- [Testing](#testing)
- [Security](#security)
- [Monitoring](#monitoring)

## Client Configuration

### ✅ DO: Create a Single Client Instance

Create one client instance per API and reuse it throughout your application.

```typescript
// api/client.ts
import { HttpClient } from '1000fetches'

export const apiClient = new HttpClient({
  baseUrl: process.env.API_BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'MyApp/1.0.0',
  },
  retryOptions: {
    maxRetries: 3,
    retryDelay: 1000,
    retryStatusCodes: [408, 429, 500, 502, 503, 504],
  },
})
```

### ✅ DO: Use Environment-Specific Configuration

```typescript
const config = {
  development: {
    baseUrl: 'http://localhost:3000/api',
    timeout: 30_000, // Longer timeout for development
  },
  production: {
    baseUrl: 'https://api.myapp.com',
    timeout: 10_000,
  },
}

export const apiClient = new HttpClient(config[process.env.NODE_ENV])
```

### ❌ DON'T: Create Multiple Clients for the Same API

```typescript
// Bad: Creates unnecessary overhead
const userClient = new HttpClient({ baseUrl: 'https://api.example.com' })
const postClient = new HttpClient({ baseUrl: 'https://api.example.com' })

// Good: Use one client with different endpoints
const apiClient = new HttpClient({ baseUrl: 'https://api.example.com' })
```

## Error Handling

### ✅ DO: Handle Specific Error Types

```typescript
import {
  HttpError,
  NetworkError,
  TimeoutError,
  SchemaValidationError,
} from '1000fetches'

async function fetchUser(id: string) {
  try {
    return await apiClient.get(`/users/${id}`)
  } catch (error) {
    if (error instanceof HttpError) {
      switch (error.status) {
        case 404:
          throw new UserNotFoundError(`User ${id} not found`)
        case 403:
          throw new UnauthorizedError('Access denied')
        default:
          throw new ApiError(`API error: ${error.status}`)
      }
    } else if (error instanceof NetworkError) {
      throw new ConnectivityError('Network connection failed')
    } else if (error instanceof TimeoutError) {
      throw new TimeoutError('Request timed out')
    } else {
      throw error
    }
  }
}
```

### ✅ DO: Implement Retry Logic for Idempotent Operations

```typescript
// Good: Retry safe operations
const user = await apiClient.get('/users/1', {
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
  },
})

// Be careful: Only retry idempotent operations
const newUser = await apiClient.post('/users', userData, {
  retry: false,
})
```

## Schema Validation

### ✅ DO: Validate Response Data

```typescript
import { z } from 'zod'

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  age: z.number().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

await apiClient.get(`/users/${id}`, { schema: userSchema })
```

## Middleware

### ✅ DO: Use Middleware for Cross-Cutting Concerns

```typescript
// Authentication
apiClient.addRequestMiddleware(async context => {
  const token = await getAuthToken()
  return {
    ...context,
    headers: {
      ...context.headers,
      Authorization: `Bearer ${token}`,
    },
  }
})

// Request/Response Logging
apiClient.addResponseMiddleware(async context => {
  console.log(`← ${context.status} ${context.method} ${context.url}`)
  return context
})
```

### ✅ DO: Handle Middleware Errors Gracefully

```typescript
apiClient.addRequestMiddleware(async context => {
  try {
    const token = await getAuthToken()
    return {
      ...context,
      headers: {
        ...context.headers,
        Authorization: `Bearer ${token}`,
      },
    }
  } catch (error) {
    // Log the error but don't fail the request
    console.warn('Failed to get auth token:', error)
    return context
  }
})
```

### ❌ DON'T: Perform Heavy Operations in Middleware

```typescript
// Bad: Heavy computation in middleware
apiClient.addRequestMiddleware(async context => {
  const heavyResult = await performHeavyComputation() // Slows down all requests
  return context
})

// Good: Keep middleware lightweight
apiClient.addRequestMiddleware(async context => {
  return {
    ...context,
    headers: {
      ...context.headers,
      'X-Request-ID': generateRequestId(), // Fast operation
    },
  }
})
```

## Performance Optimization

### ✅ DO: Use Appropriate Timeouts

```typescript
const client = new HttpClient({
  baseUrl: 'https://api.example.com',
  timeout: 10000, // Default 10 seconds
})

// Override per request for long operations
await client.post('/export', data, { timeout: 60000 })
```

### ✅ DO: Implement Request Cancellation

```typescript
async function searchUsers(query: string, signal?: AbortSignal) {
  return await apiClient.get('/users/search', {
    params: { q: query },
    signal,
  })
}

const controller = new AbortController()
const searchPromise = searchUsers('john', controller.signal)

// Cancel if needed
controller.abort()
```

## Testing

### ✅ DO: Mock HTTP Calls in Tests

```typescript
import { vi } from 'vitest'
import { apiClient } from '../api/client'

// Mock the client
vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('UserService', () => {
  it('should fetch user by id', async () => {
    const mockUser = { id: 1, name: 'John', email: 'john@example.com' }

    vi.mocked(apiClient.get).mockResolvedValue({
      data: mockUser,
      status: 200,
      statusText: 'OK',
      headers: {},
      method: 'GET',
      url: '/users/1',
      raw: new Response(),
    })

    const user = await UserService.getUser('1')

    expect(apiClient.get).toHaveBeenCalledWith('/users/1')
    expect(user).toEqual(mockUser)
  })
})
```

## Security

### ❌ DON'T: Store Secrets in Client Code

```typescript
// Bad: Hardcoded API key
const apiClient = new HttpClient({
  baseUrl: 'https://api.example.com',
  headers: {
    'X-API-Key': 'sk-1234567890abcdef', // Never do this!
  },
})

// Good: Use environment variables
const apiClient = new HttpClient({
  baseUrl: process.env.API_BASE_URL,
  headers: {
    'X-API-Key': process.env.API_KEY,
  },
})
```

## Common Anti-Patterns

### ❌ DON'T: Ignore Error Handling

```typescript
// Bad: Silent failures
try {
  const user = await apiClient.get('/users/1')
  return user.data
} catch {
  return null // Silently fails
}

// Good: Explicit error handling
try {
  const user = await apiClient.get('/users/1')
  return user.data
} catch (error) {
  if (error instanceof HttpError && error.status === 404) {
    return null
  }
  throw error // Re-throw unexpected errors
}
```

### ❌ DON'T: Use Generic Error Messages

```typescript
// Bad: Generic error
throw new Error('Something went wrong')

// Good: Specific error with context
throw new Error(`Failed to fetch user ${userId}: ${error.message}`)
```

### ❌ DON'T: Block the Event Loop

```typescript
// Bad: Synchronous operations in middleware
apiClient.addRequestMiddleware(context => {
  const result = fs.readFileSync('/path/to/file') // Blocks event loop
  return context
})

// Good: Asynchronous operations
apiClient.addRequestMiddleware(async context => {
  const result = await fs.promises.readFile('/path/to/file')
  return context
})
```

## Summary

Following these best practices will help you build robust, maintainable, and performant applications with 1000fetches:

1. **Configure once, use everywhere** - Create a single, well-configured client instance
2. **Handle errors explicitly** - Don't let errors fail silently
3. **Validate data** - Use schemas to ensure data integrity
4. **Keep middleware lightweight** - Avoid heavy operations that slow down requests
5. **Test thoroughly** - Mock HTTP calls and test error scenarios
