import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Better Auth client.
 *
 * The auth server lives in the API repository (job-app-tracker-api) and is
 * reached over HTTP only — no API source files are referenced here. Requests
 * go to this app's own `/api/auth/*` path:
 *
 * - In development, Vite proxies that path to the NestJS API (see
 *   `server.proxy` in `vite.config.ts`).
 * - In production, the deployment must expose the same reverse proxy, or the
 *   client must be pointed at the API with an explicit `baseURL`.
 *
 * Because requests are same-origin from the browser's perspective, the session
 * cookie is set on this app's origin and sent back through the proxy.
 *
 * `baseURL: ""` falls back to `/api/auth` (better-auth's same-domain default).
 */
export const authClient = createAuthClient({
  baseURL: "",
  plugins: [
    // Mirrors the API's `user.additionalFields.defaultCurrency` so the field
    // is present in the inferred session/user types. This is a client-side
    // type declaration only — the field is server-owned (`input: false`).
    inferAdditionalFields({
      user: {
        defaultCurrency: { type: "string", required: false },
      },
    }),
  ],
});

export type AuthSession = typeof authClient.$Infer.Session;
export type AuthUser = AuthSession["user"];

export const { useSession } = authClient;
