/**
 * HTTP client for the Job App Tracker API (`job-app-tracker-api`).
 *
 * Contract enforced by this client (see the API's README):
 * - Every request carries the required `X-Api-Version` header (NestJS header
 *   versioning). It defaults to `DEFAULT_API_VERSION` and can be overridden
 *   per request for future versions.
 * - Successful responses are wrapped in `{ data, meta }` by the API's
 *   `ResponseInterceptor`; the envelope is unwrapped so callers receive the
 *   payload directly.
 * - Errors are normalised into `ApiError`, built from the API's
 *   `{ error: { code, message, details } }` body.
 *
 * Authentication is cookie-based (better-auth DB-backed session cookie), so
 * requests are always sent with `credentials: "include"`. There is no bearer
 * token: the auth feature owns the session, this client never touches it.
 *
 * By default requests target the same origin at `/api` (Vite proxies it to the
 * API in dev; production must expose the same reverse proxy as `/api/auth`).
 * Pass `baseUrl` to `createApiClient` to call a different origin directly.
 * Paths are relative to the base, e.g. `/applications`, `/settings`,
 * `/users/me` — do not include `/api`.
 *
 * @example
 * import { api } from "@/lib/api.library";
 *
 * const page = await api.get<PaginatedResponse<JobApplication>>("/applications", {
 *   query: { page: 1, limit: 20, statuses: ["APPLIED", "INTERVIEW"] },
 * });
 *
 * await api.patch<Settings>("/settings", { language: "es" });
 */

/** Version sent when the caller does not specify one. */
export const DEFAULT_API_VERSION = "1";

/** Same-origin base path proxied to the API (see `vite.config.ts`). */
const DEFAULT_BASE_URL = "/api";

/** Abort requests that take longer than this (milliseconds). */
const DEFAULT_TIMEOUT_MS = 15_000;

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Validation detail returned by the API for 400 responses. */
export interface ApiErrorDetail {
  field: string;
  message: string;
}

/** Body returned by the API's global `HttpExceptionFilter`. */
export interface ApiErrorResponse {
  error?: {
    code?: number;
    message?: string;
    details?: ApiErrorDetail[];
  };
  meta?: { timestamp?: string };
}

/** Values accepted in a query string; arrays become repeated keys. */
export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ReadonlyArray<string | number | boolean>;

/** Per-request options. */
export interface RequestOptions {
  method?: HttpMethod;
  /** Serialised as JSON unless it is a native body (FormData, Blob, ...). */
  body?: unknown;
  /** Query parameters; `null`, `undefined` and `""` are skipped. */
  query?: Record<string, QueryValue>;
  /** Overrides the client's default `X-Api-Version` for this request. */
  apiVersion?: string | number;
  /** Extra headers. Reserved headers (`X-Api-Version`, `Accept`, JSON `Content-Type`) win. */
  headers?: HeadersInit;
  /** Caller cancellation; combined with the client timeout. */
  signal?: AbortSignal;
}

/** Options for methods that never send a body. */
type BodylessOptions = Omit<RequestOptions, "method" | "body">;

export interface ApiClientConfig {
  /**
   * API base URL including the `/api` prefix. Defaults to the same-origin
   * `/api` proxy (e.g. `https://api.example.com/api` to call the API
   * directly).
   */
  baseUrl?: string;
  /** Default `X-Api-Version` for every request. */
  apiVersion?: string | number;
  /** Request timeout in milliseconds; `0` disables it. */
  timeoutMs?: number;
  /** Fetch credentials mode. Cookie auth requires `"include"`. */
  credentials?: RequestCredentials;
}

export interface ApiClient {
  /** Escape hatch with full control over the request. */
  request<T>(path: string, options?: RequestOptions): Promise<T>;
  get<T>(path: string, options?: BodylessOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: BodylessOptions): Promise<T>;
  put<T>(path: string, body?: unknown, options?: BodylessOptions): Promise<T>;
  patch<T>(path: string, body?: unknown, options?: BodylessOptions): Promise<T>;
  delete<T>(path: string, options?: BodylessOptions): Promise<T>;
}

/**
 * Error thrown for every failed request.
 *
 * `status === 0` means the request never reached the API (network failure,
 * timeout, or cancellation).
 */
export class ApiError extends Error {
  /** HTTP status code, or `0` when no response was received. */
  readonly status: number;
  /** Status code echoed by the API error body, when present. */
  readonly code?: number;
  /** Field-level validation errors (400 responses). */
  readonly details?: ApiErrorDetail[];
  /** Raw parsed response body, useful for logging. */
  readonly body?: unknown;

  constructor(
    message: string,
    status: number,
    options: { code?: number; details?: ApiErrorDetail[]; body?: unknown; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "ApiError";
    this.status = status;
    this.code = options.code;
    this.details = options.details;
    this.body = options.body;
  }

  /** True when the API could not be reached at all. */
  get isNetworkError(): boolean {
    return this.status === 0;
  }

  /** True for 4xx responses. */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /** True for 5xx responses. */
  get isServerError(): boolean {
    return this.status >= 500;
  }

  /** Session expired or missing — the caller should send the user to sign-in. */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** Resource missing or not owned by the current user. */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** True when the API rejected the payload with field-level details. */
  get isValidationError(): boolean {
    return this.status === 400 && (this.details?.length ?? 0) > 0;
  }
}

/** Removes trailing slashes without a backtracking-prone regex. */
function stripTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value.codePointAt(end - 1) === 47 /* "/" */) end -= 1;
  return value.slice(0, end);
}

/**
 * Resolves the API base URL: explicit config first, then the same-origin
 * `/api` proxy. Trailing slashes are trimmed so paths can be joined directly.
 */
function resolveBaseUrl(baseUrl?: string): string {
  return stripTrailingSlashes(baseUrl?.trim() || DEFAULT_BASE_URL);
}

/** Builds `?a=1&b=2&b=3` from the query object. */
function buildQueryString(query: Record<string, QueryValue> | undefined): string {
  if (!query) return "";

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;

    if (Array.isArray(value)) {
      // The API's DTO transforms support repeated keys (?statuses=A&statuses=B).
      for (const item of value) params.append(key, String(item));
    } else {
      params.set(key, String(value));
    }
  }

  return params.toString();
}

/** Joins the base URL, path and query string without duplicate slashes. */
function buildUrl(baseUrl: string, path: string, query?: Record<string, QueryValue>): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const search = buildQueryString(query);
  if (!search) return `${baseUrl}${normalizedPath}`;
  return `${baseUrl}${normalizedPath}${normalizedPath.includes("?") ? "&" : "?"}${search}`;
}

/** Bodies that must be passed to `fetch` untouched (no JSON serialisation). */
function isNativeBody(body: unknown): body is BodyInit {
  return (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  );
}

/**
 * Creates a signal that aborts on the caller's signal or after `timeoutMs`,
 * so a hung request never leaks a pending promise.
 */
function withTimeout(
  signal: AbortSignal | undefined,
  timeoutMs: number,
): { signal: AbortSignal | undefined; cleanup: () => void } {
  if (timeoutMs <= 0 && !signal) return { signal: undefined, cleanup: () => {} };

  const controller = new AbortController();
  const timer =
    timeoutMs > 0
      ? setTimeout(
          () => controller.abort(new DOMException(`Request timed out after ${timeoutMs} ms`, "TimeoutError")),
          timeoutMs,
        )
      : undefined;

  const onAbort = () => controller.abort(signal?.reason);
  if (signal) {
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener("abort", onAbort, { once: true });
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      if (timer !== undefined) clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    },
  };
}

/** Parses a response body, tolerating 204/205 and non-JSON payloads. */
async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) return undefined;

  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/** Converts a failed response into an `ApiError` using the API error contract. */
function createApiError(response: Response, body: unknown): ApiError {
  const error = (body as ApiErrorResponse | undefined)?.error;
  const message = error?.message || response.statusText || `Request failed with status ${response.status}`;

  return new ApiError(message, response.status, {
    code: error?.code,
    details: error?.details,
    body,
  });
}

/** Converts `fetch` rejections into `ApiError`s with a readable message. */
function normalizeFetchError(error: unknown, signal: AbortSignal | undefined, timeoutMs: number): unknown {
  if (error instanceof DOMException && (error.name === "AbortError" || error.name === "TimeoutError")) {
    const timedOut = signal?.reason instanceof DOMException && signal.reason.name === "TimeoutError";
    return new ApiError(timedOut ? `Request timed out after ${timeoutMs} ms.` : "Request was cancelled.", 0, {
      cause: error,
    });
  }

  if (error instanceof TypeError) {
    return new ApiError("Unable to reach the API. Please check your connection and try again.", 0, { cause: error });
  }

  return error;
}

/**
 * Unwraps the API's `{ data, meta }` envelope. Non-enveloped bodies (for
 * example a raw string) are returned unchanged.
 */
function unwrapEnvelope<T>(body: unknown): T {
  if (body !== null && typeof body === "object" && "data" in body && "meta" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

/**
 * Creates an API client. Most callers should use the shared `api` instance
 * exported at the bottom of this file; create a client explicitly when a
 * different origin or version is needed (e.g. tests).
 */
export function createApiClient(config: ApiClientConfig = {}): ApiClient {
  const baseUrl = resolveBaseUrl(config.baseUrl);
  const defaultVersion = config.apiVersion ?? DEFAULT_API_VERSION;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const credentials = config.credentials ?? "include";

  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, query, apiVersion = defaultVersion, headers, signal } = options;

    const requestHeaders = new Headers(headers);
    // Reserved headers are set after the caller's so the contract can't be
    // accidentally broken with a typo in a feature service.
    requestHeaders.set("X-Api-Version", String(apiVersion));
    if (!requestHeaders.has("Accept")) requestHeaders.set("Accept", "application/json");

    let payload: BodyInit | undefined;
    if (body !== undefined && body !== null && method !== "GET") {
      if (isNativeBody(body)) {
        payload = body;
      } else {
        if (!requestHeaders.has("Content-Type")) requestHeaders.set("Content-Type", "application/json");
        payload = JSON.stringify(body);
      }
    }

    const timeout = withTimeout(signal, timeoutMs);

    let response: Response;
    try {
      response = await fetch(buildUrl(baseUrl, path, query), {
        method,
        headers: requestHeaders,
        body: payload,
        credentials,
        signal: timeout.signal,
      });
    } catch (error) {
      throw normalizeFetchError(error, timeout.signal, timeoutMs);
    } finally {
      timeout.cleanup();
    }

    if (response.status === 204 || response.status === 205) return undefined as T;

    const parsed = await parseBody(response);
    if (!response.ok) throw createApiError(response, parsed);

    return unwrapEnvelope<T>(parsed);
  }

  return {
    request,
    get: (path, options) => request(path, { ...options, method: "GET" }),
    post: (path, body, options) => request(path, { ...options, method: "POST", body }),
    put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
    patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
    delete: (path, options) => request(path, { ...options, method: "DELETE" }),
  };
}

/** Shared client used across the app (auth excluded — better-auth owns it). */
export const api = createApiClient();
