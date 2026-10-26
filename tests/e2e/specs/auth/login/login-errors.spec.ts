import { expect, test } from '../../../fixtures'
import { TEST_ACCOUNTS, WRONG_PASSWORD } from '../../../fixtures/users'
import type { SignInOutcome } from '../../../mocks/auth-api.mock'

/**
 * API failure paths for the sign-in screen.
 *
 * The UI maps raw API errors to human-readable copy via `humaniseError`, so
 * each scenario asserts the *mapped* message rather than the backend wording.
 */

interface FailureScenario {
  name: string
  response: SignInOutcome
  message: string
}

const FAILURE_SCENARIOS = [
  {
    name: 'invalid credentials',
    response: { outcome: 'invalid-credentials' },
    message: 'Incorrect email or password.',
  },
  {
    name: 'rate limiting',
    response: { outcome: 'rate-limited' },
    message: 'Too many attempts. Please try again later.',
  },
  {
    name: 'a failed CAPTCHA challenge',
    response: { outcome: 'captcha-failed' },
    message: 'Security verification failed. Please try again.',
  },
  {
    name: 'an unverified email address',
    response: { outcome: 'email-not-verified' },
    message: 'Please verify your email address before signing in.',
  },
  {
    name: 'a server error',
    response: { outcome: 'server-error' },
    message: 'An unexpected error occurred. Please try again.',
  },
  {
    name: 'a network failure',
    response: { outcome: 'network-error' },
    message: 'An unexpected error occurred. Please try again.',
  },
] satisfies ReadonlyArray<FailureScenario>

const account = TEST_ACCOUNTS.verified
const credentials = { email: account.user.email, password: WRONG_PASSWORD }

test.describe('Login failures', () => {
  for (const scenario of FAILURE_SCENARIOS) {
    test(`shows an actionable error for ${scenario.name}`, async ({
      authApi,
      loginPage,
      page,
    }) => {
      // Arrange
      authApi.respondWith(scenario.response)

      // Act
      await loginPage.goto()
      await loginPage.signIn(credentials)

      // Assert
      await loginPage.expectError(scenario.message)
      await expect(page).toHaveURL('/')
      await expect(loginPage.form).toBeVisible()
      /* The attempted email is preserved so the user only retypes the password. */
      await expect(loginPage.emailInput).toHaveValue(credentials.email)
      expect(authApi.signInRequests).toHaveLength(1)
    })
  }

  test('does not leak the raw backend message to the user', async ({
    authApi,
    loginPage,
  }) => {
    // Arrange
    authApi.respondWith({ outcome: 'invalid-credentials' })

    // Act
    await loginPage.goto()
    await loginPage.signIn(credentials)

    // Assert
    await loginPage.expectError('Incorrect email or password.')
    await expect(loginPage.errorBanner).not.toContainText('Invalid email or password')
  })

  test('lets the user retry successfully after a failed attempt', async ({
    authApi,
    dashboardPage,
    loginPage,
  }) => {
    // Arrange
    authApi.respondWith({ outcome: 'invalid-credentials' })
    await loginPage.goto()
    await loginPage.signIn(credentials)
    await loginPage.expectError('Incorrect email or password.')

    // Act
    authApi.respondWith({ outcome: 'success', user: account.user })
    await loginPage.fillPassword(account.password)
    await loginPage.submit()

    // Assert
    await dashboardPage.expectLoaded()
    expect(authApi.signInRequests).toHaveLength(2)
    expect(authApi.lastSignInRequest?.payload).toEqual({
      email: account.user.email,
      password: account.password,
    })
  })
})
