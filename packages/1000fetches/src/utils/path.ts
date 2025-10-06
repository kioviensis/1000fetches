import { PathParameterError } from '../errors'

/**
 * Strips protocol from URL (e.g., https://, http://)
 */
type StripProtocol<T extends string> = T extends `${string}://${infer After}`
  ? After
  : T

/**
 * Strips host and optional port from URL, keeping only the path
 * Handles cases like "localhost:3000/users" -> "/users"
 */
type StripHost<T extends string> = T extends `${infer _Host}/${infer Path}`
  ? `/${Path}`
  : T

/**
 * Strips query string from path (e.g., "/users?x=1" -> "/users")
 * Only strips ? that comes after the path, not ? that's part of path parameters
 */
type StripQuery<T extends string> = T extends `${infer Path}?${infer Query}`
  ? Query extends
      | `${string}=${string}`
      | `${string}=${string}&${string}`
      | `${string}&${string}`
    ? Path // contains = or &
    : Query extends `/${string}`
      ? T // it's another path segment
      : Query extends ``
        ? T // it's an optional param marker
        : Path // plain query params like ?param
  : T

/**
 * Normalizes URL to path only, stripping protocol, host, port, and query
 */
type NormalizePath<T extends string> = StripQuery<StripHost<StripProtocol<T>>>

/**
 * Removes optional suffix from param name (e.g., ":id?" -> "id", ":id" -> "id")
 */
type CleanParamName<S extends string> = S extends `:${infer Name}?`
  ? Name
  : S extends `:${infer Name}`
    ? Name
    : S

/**
 * Extracts all path parameters from a route
 */
export type ExtractRouteParams<T extends string> =
  NormalizePath<T> extends `${infer _Before}:${infer AfterColon}`
    ? AfterColon extends `${infer Param}/${infer Rest}`
      ? CleanParamName<`:${Param}`> | ExtractRouteParams<`/${Rest}`>
      : CleanParamName<`:${AfterColon}`>
    : never

export type HasRequiredParams<T extends string> = [
  ExtractRouteParams<T>,
] extends [never]
  ? false
  : true

/**
 * PathParams type - extracts parameter names and their types
 */
export type PathParams<Path extends string> = {
  [K in ExtractRouteParams<Path>]: string | number
}

/**
 * RequirePathParams enforces pathParams when needed
 */
export type RequirePathParams<Path extends string, T> =
  HasRequiredParams<Path> extends true
    ? T & { pathParams: PathParams<Path> }
    : T

/**
 * Interpolates parameters into a URL template
 * Similar to React Router's generatePath function
 *
 * @example
 * ```ts
 * const path = generatePath('/users/:id/posts/:postId', { id: '123', postId: '456' });
 * // => '/users/123/posts/456'
 * ```
 */
export function generatePath<Path extends string>(
  path: Path,
  params: PathParams<Path> = {} as PathParams<Path>
): string {
  return path.replace(/:([a-zA-Z0-9_]+)/g, (_match, paramName: string) => {
    if (params[paramName as keyof PathParams<Path>] === undefined) {
      throw new PathParameterError(
        `Missing required path parameter: ${paramName}`,
        path,
        [paramName],
        Object.keys(params)
      )
    }
    return String(params[paramName as keyof PathParams<Path>])
  })
}
