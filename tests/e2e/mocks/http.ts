import type { Route } from '@playwright/test'

/**
 * Shared helpers for the in-browser API mocks.
 *
 * The real API is a NestJS service that wraps every successful response in a
 * `{ data, meta }` envelope and every failure in `{ error, meta }`. The mocks
 * reproduce those contracts exactly so the production client code runs
 * unmodified.
 */

/** `ResponseInterceptor` envelope used by the NestJS API. */
export interface ApiEnvelope<T> {
  data: T
  meta: Record<string, unknown>
}

/** `HttpExceptionFilter` body used by the NestJS API. */
export interface ApiErrorBody {
  error: {
    code: number
    message: string
    details?: ReadonlyArray<{ field: string; message: string }>
  }
  meta: { timestamp: string }
}

/**
 * Fulfils a request with JSON. `null` is a legitimate body: better-auth returns
 * a literal `null` from `GET /api/auth/get-session` for anonymous visitors.
 */
export async function fulfillJson(
  route: Route,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<void> {
  await route.fulfill({
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
    body: JSON.stringify(body),
  })
}

/** Fulfils a request with the `{ data, meta }` envelope of the NestJS API. */
export async function fulfillEnvelope<T>(
  route: Route,
  data: T,
  status = 200,
): Promise<void> {
  const body: ApiEnvelope<T> = { data, meta: { timestamp: new Date().toISOString() } }
  await fulfillJson(route, status, body)
}

/** Fulfils a request with the `{ error, meta }` body of the NestJS API. */
export async function fulfillApiError(
  route: Route,
  status: number,
  message: string,
): Promise<void> {
  const body: ApiErrorBody = {
    error: { code: status, message },
    meta: { timestamp: new Date().toISOString() },
  }
  await fulfillJson(route, status, body)
}

/** Reads (and parses) the JSON request body. Returns `{}` for bodyless calls. */
export function readJsonBody<T>(route: Route): T {
  const raw = route.request().postData()
  return (raw ? JSON.parse(raw) : {}) as T
}

/** Pathname of the intercepted request, e.g. `/api/auth/sign-in/email`. */
export function requestPath(route: Route): string {
  return new URL(route.request().url()).pathname
}

/** Resolves after `ms`, keeping the request "in flight" for loading states. */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
