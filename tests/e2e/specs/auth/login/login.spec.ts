import { expect, test } from '../../../fixtures'
import { TEST_ACCOUNTS } from '../../../fixtures/users'

/**
 * Happy-path coverage for the sign-in screen (`/`).
 *
 * Each test follows Arrange → Act → Assert.
 */

const account = TEST_ACCOUNTS.verified
const credentials = { email: account.user.email, password: account.password }

test.describe('Login', () => {
  test.describe('when valid credentials are submitted', () => {
    test('renders an empty, accessible sign-in form', async ({ authApi, loginPage }) => {
      // Arrange
      // Anonymous session is the fixture default; nothing else to prepare.

      // Act
      await loginPage.goto()

      // Assert
      await expect(loginPage.subtitle).toBeVisible()
      await expect(loginPage.emailInput).toHaveValue('')
      await expect(loginPage.passwordInput).toHaveValue('')
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password')
      await expect(loginPage.submitButton).toHaveText('Sign in')
      await expect(loginPage.signUpButton).toBeVisible()
      await loginPage.expectNoError()
      expect(authApi.signInRequests).toHaveLength(0)
    })

    test('signs in and lands on the dashboard with data loaded', async ({
      appApi,
      authApi,
      dashboardPage,
      loginPage,
    }) => {
      // Arrange
      authApi.respondWith({ outcome: 'success', user: account.user })

      // Act
      await loginPage.goto()
      await loginPage.signIn(credentials)

      // Assert
      await dashboardPage.expectLoaded()
      await dashboardPage.expectSummary(appApi.dashboardCounts)
      expect(authApi.signInRequests).toHaveLength(1)
      expect(authApi.lastSignInRequest?.payload).toEqual(credentials)
    })

    test('disables the submit button and shows progress while the request is in flight', async ({
      authApi,
      dashboardPage,
      loginPage,
    }) => {
      // Arrange
      authApi.respondWith({ outcome: 'success', user: account.user }, { latencyMs: 750 })

      // Act
      await loginPage.goto()
      await loginPage.fillCredentials(credentials)
      await loginPage.submit()

      // Assert
      await loginPage.expectSubmitting()
      await dashboardPage.expectLoaded()
      expect(authApi.signInRequests).toHaveLength(1)
    })

    test('submits when Enter is pressed in the password field', async ({
      authApi,
      dashboardPage,
      loginPage,
    }) => {
      // Arrange
      authApi.respondWith({ outcome: 'success', user: account.user })
      await loginPage.goto()
      await loginPage.fillEmail(credentials.email)
      await loginPage.fillPassword(credentials.password)

      // Act
      await loginPage.passwordInput.press('Enter')

      // Assert
      await dashboardPage.expectLoaded()
      expect(authApi.signInRequests).toHaveLength(1)
    })

    test('toggles password visibility without submitting the form', async ({
      authApi,
      loginPage,
    }) => {
      // Arrange
      await loginPage.goto()
      await loginPage.fillPassword(credentials.password)

      // Act — reveal
      await loginPage.togglePasswordVisibility()

      // Assert
      await loginPage.expectPasswordVisible(true)

      // Act — hide again
      await loginPage.togglePasswordVisibility()

      // Assert
      await loginPage.expectPasswordVisible(false)
      expect(authApi.signInRequests).toHaveLength(0)
    })
  })

  test.describe('when navigating from the sign-in screen', () => {
    test('opens the registration screen from the "Sign up" link', async ({
      loginPage,
      registerPage,
    }) => {
      // Arrange
      await loginPage.goto()

      // Act
      await loginPage.goToRegister()

      // Assert
      await registerPage.expectLoaded()
    })
  })
})
