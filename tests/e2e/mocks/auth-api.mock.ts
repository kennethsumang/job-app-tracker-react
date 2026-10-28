import type { Page, Route } from '@playwright/test'
import { TEST_ACCOUNTS, buildSession, type MockUser } from '../fixtures/users'
import { delay, fulfillJson, readJsonBody, requestPath } from './http'

/**
 * In-browser mock of the better-auth endpoints mounted by the NestJS API at
 * `/api/auth/*`.
 *
 * The mock is stateful: a successful sign-in or sign-up flips the mocked
 * session, so a subsequent `get-session` (page reload, hard navigation,
 * sign-out) behaves like the real cookie session. That is what lets the suite
 * test the auth guard and session persistence without a real backend.
 *
 * Endpoints covered:
 * - `GET  /api/auth/get-session`   → `{ session, user }` or `null`
 * - `POST /api/auth/sign-in/email` → success or a configurable failure
 * - `POST /api/auth/sign-up/email` → success or a configurable failure
 * - `POST /api/auth/sign-out`      → `{ success: true }` and clears the session
 */

/** Failure modes the login page knows how to humanise. */
export type SignInOutcome =
  | { outcome: 'success'; user?: MockUser }
  | { outcome: 'invalid-credentials' }
  | { outcome: 'rate-limited' }
  | { outcome: 'captcha-failed' }
  | { outcome: 'email-not-verified' }
  | { outcome: 'server-error' }
  | { outcome: 'network-error' }

/** Failure modes the register page knows how to humanise. */
export type SignUpOutcome =
  | { outcome: 'success'; user?: MockUser }
  | { outcome: 'email-already-in-use' }
  | { outcome: 'rate-limited' }
  | { outcome: 'captcha-failed' }
  | { outcome: 'weak-password' }
  | { outcome: 'validation-failed' }
  | { outcome: 'server-error' }
  | { outcome: 'network-error' }

/** Failure modes for `POST /api/auth/change-password`. */
export type ChangePasswordOutcome =
  | { outcome: 'success' }
  | { outcome: 'invalid-password' }
  | { outcome: 'server-error' }
  | { outcome: 'network-error' }

/** Body the better-auth client sends to `sign-in/email`. */
export interface SignInPayload {
  email: string
  password: string
}

/** Body the better-auth client sends to `sign-up/email`. */
export interface SignUpPayload {
  name: string
  email: string
  password: string
}

/** Captured sign-in call, used to assert what the UI actually sent. */
export interface RecordedSignIn {
  payload: SignInPayload
  /** Value of the `X-Captcha-Response` header, if any. */
  captchaToken?: string
  at: number
}

/** Captured sign-up call, used to assert what the UI actually sent. */
export interface RecordedSignUp {
  payload: SignUpPayload
  /** Value of the `X-Captcha-Response` header, if any. */
  captchaToken?: string
  at: number
}

/** Captured change-password call, used to assert what the UI actually sent. */
export interface RecordedChangePassword {
  payload: { currentPassword: string; newPassword: string }
  at: number
}

export interface AuthApiMockOptions {
  /** Pre-authenticated user, i.e. an existing valid cookie session. */
  authenticatedAs?: MockUser | null
  /** Default sign-in outcome (success unless overridden per test). */
  signIn?: SignInOutcome
  /** Default sign-up outcome (success unless overridden per test). */
  signUp?: SignUpOutcome
  /** Artificial latency for `sign-in/email`, to observe pending UI. */
  signInLatencyMs?: number
  /** Artificial latency for `sign-up/email`, to observe pending UI. */
  signUpLatencyMs?: number
  /** Artificial latency for `get-session`, to observe the loading screen. */
  getSessionLatencyMs?: number
}

export class AuthApiMock {
  private readonly page: Page
  private sessionUser: MockUser | null
  private signInOutcome: SignInOutcome
  private signUpOutcome: SignUpOutcome
  private changePasswordOutcome: ChangePasswordOutcome
  private signInLatencyMs: number
  private signUpLatencyMs: number
  private getSessionLatencyMs: number

  /** Every sign-in request that reached the mock, in order. */
  readonly signInRequests: RecordedSignIn[] = []

  /** Every sign-up request that reached the mock, in order. */
  readonly signUpRequests: RecordedSignUp[] = []

  /** Number of sign-out calls. */
  signOutCalls = 0

  /** Number of `get-session` probes (bootstrap + reloads). */
  getSessionCalls = 0

  /** Bodies of the change-password calls that reached the mock. */
  readonly changePasswordRequests: RecordedChangePassword[] = []

  /** Requests no mock handled — surfaces contract drift immediately. */
  readonly unhandledRequests: string[] = []

  constructor(page: Page, options: AuthApiMockOptions = {}) {
    this.page = page
    this.sessionUser = options.authenticatedAs ?? null
    this.signInOutcome = options.signIn ?? { outcome: 'success' }
    this.signUpOutcome = options.signUp ?? { outcome: 'success' }
    this.changePasswordOutcome = { outcome: 'success' }
    this.signInLatencyMs = options.signInLatencyMs ?? 0
    this.signUpLatencyMs = options.signUpLatencyMs ?? 0
    this.getSessionLatencyMs = options.getSessionLatencyMs ?? 0
  }

  /** Registers the route handlers. Must run before the first navigation. */
  async install(): Promise<void> {
    await this.page.route('**/api/auth/**', (route) => this.handle(route))
  }

  /** Exposes an authenticated session to the app. */
  authenticateAs(user: MockUser = TEST_ACCOUNTS.verified.user): void {
    this.sessionUser = user
  }

  /** Clears the mocked session (what a real sign-out does). */
  clearSession(): void {
    this.sessionUser = null
  }

  /** Overrides the next sign-in responses, optionally adding latency. */
  respondWith(outcome: SignInOutcome, options: { latencyMs?: number } = {}): void {
    this.signInOutcome = outcome
    if (options.latencyMs !== undefined) {
      this.signInLatencyMs = options.latencyMs
    }
  }

  /** Overrides the next sign-up responses, optionally adding latency. */
  respondToSignUpWith(
    outcome: SignUpOutcome,
    options: { latencyMs?: number } = {},
  ): void {
    this.signUpOutcome = outcome
    if (options.latencyMs !== undefined) {
      this.signUpLatencyMs = options.latencyMs
    }
  }

  /** Overrides the change-password response. */
  respondToChangePasswordWith(outcome: ChangePasswordOutcome): void {
    this.changePasswordOutcome = outcome
  }

  /** Adds latency to the bootstrap `get-session` probe. */
  setSessionLatency(latencyMs: number): void {
    this.getSessionLatencyMs = latencyMs
  }

  /** Most recent sign-in request, for payload assertions. */
  get lastSignInRequest(): RecordedSignIn | undefined {
    return this.signInRequests.at(-1)
  }

  /** Most recent sign-up request, for payload assertions. */
  get lastSignUpRequest(): RecordedSignUp | undefined {
    return this.signUpRequests.at(-1)
  }

  private async handle(route: Route): Promise<void> {
    const path = requestPath(route)
    const endpoint = path.replace(/^\/api\/auth/, '')
    const method = route.request().method()

    switch (`${method} ${endpoint}`) {
      case 'GET /get-session':
        await this.handleGetSession(route)
        return
      case 'POST /sign-in/email':
        await this.handleSignIn(route)
        return
      case 'POST /sign-up/email':
        await this.handleSignUp(route)
        return
      case 'POST /sign-out':
        this.signOutCalls += 1
        this.sessionUser = null
        await fulfillJson(route, 200, { success: true })
        return
      case 'POST /change-password':
        await this.handleChangePassword(route)
        return
      default:
        this.unhandledRequests.push(`${method} ${path}`)
        await fulfillJson(route, 501, {
          message: `No auth mock registered for ${method} ${path}`,
        })
    }
  }

  private async handleGetSession(route: Route): Promise<void> {
    this.getSessionCalls += 1

    if (this.getSessionLatencyMs > 0) {
      await delay(this.getSessionLatencyMs)
    }

    if (!this.sessionUser) {
      await fulfillJson(route, 200, null)
      return
    }

    await fulfillJson(route, 200, {
      session: buildSession(this.sessionUser),
      user: this.sessionUser,
    })
  }

  private async handleSignIn(route: Route): Promise<void> {
    const payload = readJsonBody<SignInPayload>(route)
    this.signInRequests.push({
      payload,
      captchaToken: route.request().headers()['x-captcha-response'],
      at: Date.now(),
    })

    if (this.signInLatencyMs > 0) {
      await delay(this.signInLatencyMs)
    }

    const outcome = this.signInOutcome

    switch (outcome.outcome) {
      case 'success': {
        const user = outcome.user ?? this.sessionUser ?? TEST_ACCOUNTS.verified.user
        this.sessionUser = user
        const session = buildSession(user)

        await fulfillJson(
          route,
          200,
          {
            redirect: false,
            token: session.token,
            url: null,
            user,
          },
          {
            // Mirrors the real cookie so the mock also behaves correctly for
            // code paths that inspect `document.cookie` or storage state.
            'set-cookie': `better-auth.session_token=${session.token}; Path=/; HttpOnly; SameSite=Lax`,
          },
        )
        return
      }
      case 'invalid-credentials':
        await fulfillJson(route, 401, { message: 'Invalid email or password' })
        return
      case 'rate-limited':
        await fulfillJson(route, 429, {
          message: 'Too many login attempts. Please try again later.',
        })
        return
      case 'captcha-failed':
        await fulfillJson(route, 403, {
          message: 'Captcha verification failed',
        })
        return
      case 'email-not-verified':
        await fulfillJson(route, 403, { message: 'Email is not verified' })
        return
      case 'server-error':
        await fulfillJson(route, 500, { message: 'Internal server error' })
        return
      case 'network-error':
        await route.abort('connectionrefused')
        return
      default:
        /* c8 ignore next -- exhaustive guard, unreachable by typing */
        await fulfillJson(route, 500, { message: 'Unhandled mock outcome' })
    }
  }

  private async handleSignUp(route: Route): Promise<void> {
    const payload = readJsonBody<SignUpPayload>(route)
    this.signUpRequests.push({
      payload,
      captchaToken: route.request().headers()['x-captcha-response'],
      at: Date.now(),
    })

    if (this.signUpLatencyMs > 0) {
      await delay(this.signUpLatencyMs)
    }

    const outcome = this.signUpOutcome

    switch (outcome.outcome) {
      case 'success': {
        const user = outcome.user ?? buildRegisteredUser(payload)
        this.sessionUser = user
        const session = buildSession(user)

        await fulfillJson(
          route,
          200,
          { token: session.token, user },
          {
            'set-cookie': `better-auth.session_token=${session.token}; Path=/; HttpOnly; SameSite=Lax`,
          },
        )
        return
      }
      case 'email-already-in-use':
        await fulfillJson(route, 422, { message: 'User already exists' })
        return
      case 'rate-limited':
        await fulfillJson(route, 429, {
          message: 'Too many requests. Please try again later.',
        })
        return
      case 'captcha-failed':
        await fulfillJson(route, 403, {
          message: 'Captcha verification failed',
        })
        return
      case 'weak-password':
        await fulfillJson(route, 400, {
          message: 'Password is too short. It must be at least 8 characters.',
        })
        return
      case 'validation-failed':
        await fulfillJson(route, 400, { message: 'Validation failed' })
        return
      case 'server-error':
        await fulfillJson(route, 500, { message: 'Internal server error' })
        return
      case 'network-error':
        await route.abort('connectionrefused')
        return
      default:
        /* c8 ignore next -- exhaustive guard, unreachable by typing */
        await fulfillJson(route, 500, { message: 'Unhandled mock outcome' })
    }
  }
  private async handleChangePassword(route: Route): Promise<void> {
    const payload = readJsonBody<{
      currentPassword: string
      newPassword: string
    }>(route)
    this.changePasswordRequests.push({ payload, at: Date.now() })

    switch (this.changePasswordOutcome.outcome) {
      case 'success':
        // Changing the password invalidates the current session, so a
        // subsequent `get-session` returns null and the app can land on the
        // sign-in screen after navigating to `/`.
        this.sessionUser = null
        await fulfillJson(route, 200, {
          user: TEST_ACCOUNTS.verified.user,
        })
        return
      case 'invalid-password':
        await fulfillJson(route, 400, {
          message: 'Current password is incorrect',
        })
        return
      case 'server-error':
        await fulfillJson(route, 500, { message: 'Internal server error' })
        return
      case 'network-error':
        await route.abort('connectionrefused')
        return
      default:
        /* c8 ignore next -- exhaustive guard, unreachable by typing */
        await fulfillJson(route, 500, { message: 'Unhandled mock outcome' })
    }
  }}

/** Builds the user better-auth creates for a successful registration. */
function buildRegisteredUser(payload: SignUpPayload): MockUser {
  const now = new Date().toISOString()

  return {
    id: `usr_e2e_signup_${Date.now()}`,
    name: payload.name,
    email: payload.email,
    emailVerified: false,
    image: null,
    createdAt: now,
    updatedAt: now,
    defaultCurrency: 'USD',
  }
}
