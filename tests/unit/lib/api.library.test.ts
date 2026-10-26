/** @jest-environment node */

import { ApiError, createApiClient } from "@/lib/api.library";

const BASE_URL = "http://localhost:3000/api";

const originalFetch = global.fetch;

/** Minimal JSON response factory; a fresh instance is needed per call. */
function jsonResponse(status: number, body?: unknown, statusText = ""): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), { status, statusText });
}

function envelope<T>(data: T): { data: T; meta: { timestamp: string } } {
  return { data, meta: { timestamp: "2026-01-01T00:00:00.000Z" } };
}

function firstCall(fetchMock: jest.Mock): { url: string; init: RequestInit } {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return { url, init };
}

describe("api.library", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("sends the default API version, cookies, and no Authorization header", async () => {
    // Arrange
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(200, envelope({ items: [] }))));
    const api = createApiClient({ baseUrl: BASE_URL });

    // Act
    const result = await api.get("/applications");

    // Assert
    const { url, init } = firstCall(fetchMock);
    const headers = new Headers(init.headers);

    expect(result).toEqual({ items: [] });
    expect(url).toBe("http://localhost:3000/api/applications");
    expect(headers.get("X-Api-Version")).toBe("1");
    expect(headers.get("Accept")).toBe("application/json");
    expect(headers.has("Authorization")).toBe(false);
    expect(init.credentials).toBe("include");
  });

  it("defaults to the same-origin /api proxy", async () => {
    // Arrange
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(200, envelope(null))));
    const api = createApiClient();

    // Act
    await api.get("applications");

    // Assert
    const { url } = firstCall(fetchMock);
    expect(url).toBe("/api/applications");
  });

  it("allows overriding the API version per request", async () => {
    // Arrange
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(200, envelope(null))));
    const api = createApiClient({ baseUrl: BASE_URL, apiVersion: "1" });

    // Act
    await api.get("/applications", { apiVersion: 2 });

    // Assert
    const { init } = firstCall(fetchMock);
    expect(new Headers(init.headers).get("X-Api-Version")).toBe("2");
  });

  it("appends query parameters, repeating array values and skipping empties", async () => {
    // Arrange
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(200, envelope([]))));
    const api = createApiClient({ baseUrl: BASE_URL });

    // Act
    await api.get("/applications", {
      query: { search: "acme", page: 2, showDeleted: false, statuses: ["APPLIED", "INTERVIEW"], empty: "" },
    });

    // Assert
    const { url } = firstCall(fetchMock);
    const query = new URL(url).searchParams;

    expect(query.get("search")).toBe("acme");
    expect(query.get("page")).toBe("2");
    expect(query.get("showDeleted")).toBe("false");
    expect(query.getAll("statuses")).toEqual(["APPLIED", "INTERVIEW"]);
    expect(query.has("empty")).toBe(false);
  });

  it("serialises JSON bodies and sets the content type", async () => {
    // Arrange
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(200, envelope({ id: "abc" }))));
    const api = createApiClient({ baseUrl: BASE_URL });

    // Act
    await api.patch("/settings", { language: "es" });

    // Assert
    const { init } = firstCall(fetchMock);
    expect(init.method).toBe("PATCH");
    expect(init.body).toBe(JSON.stringify({ language: "es" }));
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
  });

  it("resolves to undefined for 204 responses", async () => {
    // Arrange
    fetchMock.mockImplementation(() => Promise.resolve(new Response(null, { status: 204 })));
    const api = createApiClient({ baseUrl: BASE_URL });

    // Act
    const result = await api.delete<void>("/users/me");

    // Assert
    expect(result).toBeUndefined();
  });

  it("throws a typed ApiError for API error responses", async () => {
    // Arrange
    const errorBody = {
      error: {
        code: 400,
        message: "Validation failed",
        details: [{ field: "email", message: "email must be an email" }],
      },
    };
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse(400, errorBody)));
    const api = createApiClient({ baseUrl: BASE_URL });

    // Act
    const promise = api.post("/applications", { companyName: "" });

    // Assert
    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({
      message: "Validation failed",
      status: 400,
      code: 400,
      details: [{ field: "email", message: "email must be an email" }],
      body: errorBody,
    });

    const error = (await promise.catch((e: unknown) => e)) as ApiError;
    expect(error.isValidationError).toBe(true);
    expect(error.isClientError).toBe(true);
    expect(error.isNotFound).toBe(false);
  });

  it("flags 401 responses as unauthorized", async () => {
    // Arrange
    fetchMock.mockImplementation(() =>
      Promise.resolve(jsonResponse(401, { error: { code: 401, message: "Unauthorized" } })),
    );
    const api = createApiClient({ baseUrl: BASE_URL });

    // Act
    const promise = api.get("/settings");

    // Assert
    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({ status: 401, message: "Unauthorized" });
    await expect(promise.catch((e: ApiError) => e.isUnauthorized)).resolves.toBe(true);
  });

  it("wraps network failures in an ApiError with status 0", async () => {
    // Arrange
    fetchMock.mockImplementation(() => Promise.reject(new TypeError("Failed to fetch")));
    const api = createApiClient({ baseUrl: BASE_URL });

    // Act
    const promise = api.get("/applications");

    // Assert
    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({ status: 0 });

    const error = (await promise.catch((e: unknown) => e)) as ApiError;
    expect(error.isNetworkError).toBe(true);
  });

  it("falls back to the status text when the error body is not JSON", async () => {
    // Arrange
    fetchMock.mockImplementation(() =>
      Promise.resolve(new Response("Bad gateway", { status: 502, statusText: "Bad Gateway" })),
    );
    const api = createApiClient({ baseUrl: BASE_URL });

    // Act
    const promise = api.get("/applications");

    // Assert
    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({ status: 502, message: "Bad Gateway" });
  });
});
