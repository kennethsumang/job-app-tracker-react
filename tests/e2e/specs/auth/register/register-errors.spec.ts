import { expect, test } from '../../../fixtures'
import { NEW_ACCOUNT } from '../../../fixtures/users'
import type { SignUpOutcome } from '../../../mocks/auth-api.mock'

/**
 * API failure paths for the registration screen.
 *
 * The UI maps raw API errors to human-readable copy via `humaniseError`, so each
 * scenario asserts the *mapped* message rather than the backend wording.
 */

interface FailureScenario {
  name: string
  response: SignUpOutcome
  message: string
}

const FAILURE_SCENARIOS = [
  {
    name: 'an email that is already registered',
    response: { outcome: 'email-already-in-use' },
    message: 'An account already exists with this email.',
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
    name: 'a stricter server-side password policy',
    response: { outcome: 'weak-password' },
    message: 'Password must be at least 8 characters.',
  },
  {
    name: 'input rejected as invalid by the API',
    response: { outcome: 'validation-failed' },
    message: 'Please check your input and try again.',
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

const registration = {
  ...NEW_ACCOUNT,
  confirmPassword: NEW_ACCOUNT.password,
}

test.describe('Register failures', () => {
  for (const scenario of FAILURE_SCENARIOS) {
    test(`shows an actionable error for ${scenario.name}`, async ({
      authApi,
      page,
      registerPage,
    }) => {
      // Arrange
      authApi.respondToSignUpWith(scenario.response)

      // Act
      await registerPage.goto()
      await registerPage.signUp(registration)

      // Assert
      await registerPage.expectError(scenario.message)
      await expect(page).toHaveURL(/\/auth\/register$/)
      await expect(registerPage.form).toBeVisible()
      /* The typed values are preserved so the user can correct and retry. */
      await expect(registerPage.emailInput).toHaveValue(NEW_ACCOUNT.email)
      await expect(registerPage.nameInput).toHaveValue(NEW_ACCOUNT.name)
      expect(authApi.signUpRequests).toHaveLength(1)
    })
  }

  test('does not leak the raw backend message to the user', async ({
    authApi,
    registerPage,
  }) => {
    // Arrange
    authApi.respondToSignUpWith({ outcome: 'email-already-in-use' })

    // Act
    await registerPage.goto()
    await registerPage.signUp(registration)

    // Assert
    await registerPage.expectError('An account already exists with this email.')
    await expect(registerPage.errorBanner).not.toContainText(
      'User already exists',
    )
  })

  test('lets the user retry successfully after a failed attempt', async ({
    authApi,
    dashboardPage,
    registerPage,
  }) => {
    // Arrange
    authApi.respondToSignUpWith({ outcome: 'email-already-in-use' })
    await registerPage.goto()
    await registerPage.signUp(registration)
    await registerPage.expectError('An account already exists with this email.')

    // Act
    authApi.respondToSignUpWith({ outcome: 'success' })
    await registerPage.submit()

    // Assert
    await dashboardPage.expectLoaded()
    expect(authApi.signUpRequests).toHaveLength(2)
    expect(authApi.lastSignUpRequest?.payload).toEqual({
      name: NEW_ACCOUNT.name,
      email: NEW_ACCOUNT.email,
      password: NEW_ACCOUNT.password,
    })
  })
})
