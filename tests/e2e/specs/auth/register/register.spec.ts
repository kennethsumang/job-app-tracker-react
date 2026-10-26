import { expect, test } from '../../../fixtures'
import { NEW_ACCOUNT, TEST_ACCOUNTS } from '../../../fixtures/users'

/**
 * Happy-path coverage for the registration screen (`/auth/register`).
 *
 * Each test follows Arrange → Act → Assert.
 */

const registration = {
  ...NEW_ACCOUNT,
  confirmPassword: NEW_ACCOUNT.password,
}

test.describe('Register', () => {
  test.describe('when valid details are submitted', () => {
    test('renders an empty, accessible registration form', async ({
      authApi,
      registerPage,
    }) => {
      // Arrange — anonymous session is the fixture default.

      // Act
      await registerPage.goto()

      // Assert
      await expect(registerPage.nameInput).toHaveValue('')
      await expect(registerPage.emailInput).toHaveValue('')
      await expect(registerPage.passwordInput).toHaveValue('')
      await expect(registerPage.passwordInput).toHaveAttribute('type', 'password')
      await expect(registerPage.confirmPasswordInput).toHaveValue('')
      await expect(registerPage.confirmPasswordInput).toHaveAttribute(
        'type',
        'password',
      )
      await expect(registerPage.submitButton).toHaveText('Create account')
      await expect(registerPage.signInButton).toBeVisible()
      await registerPage.expectNoError()
      expect(authApi.signUpRequests).toHaveLength(0)
    })

    test('creates the account and lands on the dashboard', async ({
      authApi,
      dashboardPage,
      registerPage,
    }) => {
      // Arrange
      authApi.respondToSignUpWith({ outcome: 'success' })

      // Act
      await registerPage.goto()
      await registerPage.signUp(registration)

      // Assert
      await dashboardPage.expectLoaded()
      expect(authApi.signUpRequests).toHaveLength(1)
      expect(authApi.lastSignUpRequest?.payload).toEqual({
        name: NEW_ACCOUNT.name,
        email: NEW_ACCOUNT.email,
        password: NEW_ACCOUNT.password,
      })
    })

    test('trims the name and email before submitting', async ({
      authApi,
      dashboardPage,
      registerPage,
    }) => {
      // Arrange
      authApi.respondToSignUpWith({ outcome: 'success' })

      // Act
      await registerPage.goto()
      await registerPage.signUp({
        ...registration,
        name: `  ${NEW_ACCOUNT.name}  `,
        email: `  ${NEW_ACCOUNT.email}  `,
      })

      // Assert
      await dashboardPage.expectLoaded()
      expect(authApi.lastSignUpRequest?.payload).toEqual({
        name: NEW_ACCOUNT.name,
        email: NEW_ACCOUNT.email,
        password: NEW_ACCOUNT.password,
      })
    })

    test('disables the submit button and shows progress while the request is in flight', async ({
      authApi,
      dashboardPage,
      registerPage,
    }) => {
      // Arrange
      authApi.respondToSignUpWith({ outcome: 'success' }, { latencyMs: 750 })

      // Act
      await registerPage.goto()
      await registerPage.fillForm(registration)
      await registerPage.submit()

      // Assert
      await registerPage.expectSubmitting()
      await dashboardPage.expectLoaded()
      expect(authApi.signUpRequests).toHaveLength(1)
    })

    test('keeps the new session signed in across a reload', async ({
      authApi,
      dashboardPage,
      page,
      registerPage,
    }) => {
      // Arrange
      authApi.respondToSignUpWith({ outcome: 'success' })
      await registerPage.goto()
      await registerPage.signUp(registration)
      await dashboardPage.expectLoaded()
      const probesBeforeReload = authApi.getSessionCalls

      // Act
      await page.reload()

      // Assert
      await dashboardPage.expectLoaded()
      expect(authApi.getSessionCalls).toBeGreaterThan(probesBeforeReload)
    })

    test('toggles visibility for both password fields', async ({
      authApi,
      registerPage,
    }) => {
      // Arrange
      await registerPage.goto()
      await registerPage.fillForm(registration)

      // Act — reveal the password
      await registerPage.togglePasswordVisibility()

      // Assert
      await registerPage.expectPasswordVisible(true)
      await registerPage.expectConfirmPasswordVisible(false)

      // Act — reveal the confirmation and hide the first field again
      await registerPage.toggleConfirmPasswordVisibility()
      await registerPage.togglePasswordVisibility()

      // Assert
      await registerPage.expectPasswordVisible(false)
      await registerPage.expectConfirmPasswordVisible(true)
      expect(authApi.signUpRequests).toHaveLength(0)
    })
  })

  test.describe('when navigating from the registration screen', () => {
    test('returns to the sign-in screen from the "Sign in" link', async ({
      loginPage,
      registerPage,
    }) => {
      // Arrange
      await registerPage.goto()

      // Act
      await registerPage.goToSignIn()

      // Assert
      await loginPage.expectLoaded()
      await expect(loginPage.page).toHaveURL('/')
    })

    test('redirects an authenticated user away from the registration screen', async ({
      authApi,
      dashboardPage,
      page,
    }) => {
      // Arrange
      authApi.authenticateAs(TEST_ACCOUNTS.verified.user)

      // Act
      await page.goto('/auth/register')

      // Assert
      await dashboardPage.expectLoaded()
    })
  })
})
