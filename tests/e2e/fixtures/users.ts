/**
 * Deterministic test data for the E2E suite.
 *
 * These fixtures mirror the shapes returned by better-auth
 * (`GET /api/auth/get-session`, `POST /api/auth/sign-in/email`). Keeping them
 * in one module means a schema change surfaces in a single place.
 */

/** User object returned by better-auth. */
export interface MockUser {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: string
  updatedAt: string
  /** Additional field configured in the API's better-auth instance. */
  defaultCurrency: string
}

/** Session object returned by better-auth. */
export interface MockSession {
  id: string
  token: string
  userId: string
  expiresAt: string
  createdAt: string
  updatedAt: string
  ipAddress: string
  userAgent: string
}

/** A seeded account: user payload plus the password the mock accepts. */
export interface TestAccount {
  user: MockUser
  password: string
}

/** Fixed timestamp so snapshots/assertions never depend on the wall clock. */
const CREATED_AT = '2025-01-15T08:00:00.000Z'

/** Default password for every seeded account. */
export const TEST_PASSWORD = 'Password123!'

/** Wrong password used by negative scenarios. */
export const WRONG_PASSWORD = 'NotThePassword123!'

/** Brand-new account submitted through the registration form. */
export const NEW_ACCOUNT = {
  name: 'Alan Turing',
  email: 'alan.turing@example.com',
  password: 'Password123!',
} as const

/**
 * Accounts available to the suite.
 *
 * - `verified`   — the happy-path user.
 * - `unverified` — a user the API refuses to sign in until the email is confirmed.
 */
export const TEST_ACCOUNTS = {
  verified: {
    user: {
      id: 'usr_e2e_verified',
      name: 'Ada Lovelace',
      email: 'ada.lovelace@example.com',
      emailVerified: true,
      image: null,
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
      defaultCurrency: 'USD',
    },
    password: TEST_PASSWORD,
  },
  unverified: {
    user: {
      id: 'usr_e2e_unverified',
      name: 'Grace Hopper',
      email: 'grace.hopper@example.com',
      emailVerified: false,
      image: null,
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
      defaultCurrency: 'USD',
    },
    password: TEST_PASSWORD,
  },
} satisfies Record<string, TestAccount>

/** Builds the `session` half of the `get-session` payload for a user. */
export function buildSession(
  user: MockUser,
  token = 'mock-session-token',
): MockSession {
  return {
    id: 'ses_e2e_session',
    token,
    userId: user.id,
    expiresAt: '2030-01-15T08:00:00.000Z',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    ipAddress: '127.0.0.1',
    userAgent: 'playwright',
  }
}
