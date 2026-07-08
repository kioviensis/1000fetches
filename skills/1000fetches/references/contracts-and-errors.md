# Contracts And Errors

Use `.contract()` when response data should be validated at runtime and inferred at compile time. Pass Standard Schema-compatible schemas such as Zod, Valibot, or ArkType schemas.

```ts
import { HttpError } from '1000fetches'
import { z } from 'zod'

const UserSchema = z.object({ id: z.string(), name: z.string() })

const user = await api
  .get('/users/:id', { pathParams: { id } })
  .contract(UserSchema)
  .data()
```

Use status-specific contracts for APIs with known success or error shapes.

```ts
await api.post('/transactions', input).contract({
  success: {
    default: TransactionSchema,
    202: AcceptedSchema,
  },
  error: {
    default: ApiErrorSchema,
    409: ConflictSchema,
  },
})
```

Status map keys must be concrete HTTP status codes or `default`. Success
status maps accept concrete `2xx` and `3xx` status codes, such as `202` or
`304`. Error status maps accept concrete `4xx` and `5xx` status codes, such as
`400` or `409`. Do not use range keys such as `2xx`, `4xx`, or `5xx`.

Handle specific errors instead of broad `Error` checks when behavior differs:

```ts
try {
  return await api
    .get('/users/:id', { pathParams: { id } })
    .contract(UserSchema)
    .data()
} catch (error) {
  if (error instanceof HttpError && error.status === 404) {
    return null
  }

  throw error
}
```

Prefer `.data()` when the caller only needs the parsed body. Use `.void()` for endpoints where a successful response body should be ignored. Keep the full response when status, headers, URL, or raw `Response` matters.
