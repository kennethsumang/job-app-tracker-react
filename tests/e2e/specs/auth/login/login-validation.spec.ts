import { expect, test } from '../../../fixtures'
import { TEST_ACCOUNTS } from '../../../fixtures/users'

/**
 * Client-side validation of the sign-in form.
 *
 * The form is `noValidate`, so the browser never blocks submission — every
 * assertion here covers the app's own Zod validator. Validation failures must
 * never reach the network.
 */

const account = TEST_ACCOUNTS.verified

test.describe('Login validation', () => {
  test('shows required-field errors and sends no request when submitted empty', async ({
    authApi,
    loginPage,
    page,
  }) => {
    // Arrange
    await loginPage.goto()

    // Act
    await loginPage.submitEmpty()

    // Assert
    await loginPage.expectEmailError('Email is required.')
    await loginPage.expectPasswordError('Password is required.')
    await expect(page).toHaveURL('/')
    expect(authApi.signInRequests).toHaveLength(0)
  })

  test('rejects a malformed email address', async ({ authApi, loginPage }) => {
    // Arrange
    await loginPage.goto()

    // Act
    await loginPage.fillCredentials({ email: 'not-an-email', password: account.password })
    await loginPage.submit()

    // Assert
    await loginPage.expectEmailError('Enter a valid email address.')
    await expect(loginPage.passwordHelpText).toHaveText('')
    expect(authApi.signInRequests).toHaveLength(0)
  })

  test('requires a password when the email is valid', async ({ authApi, loginPage }) => {
    // Arrange
    await loginPage.goto()

    // Act
    await loginPage.fillEmail(account.user.email)
    await loginPage.submit()

    // Assert
    await loginPage.expectPasswordError('Password is required.')
    await loginPage.expectNoEmailError()
    expect(authApi.signInRequests).toHaveLength(0)
  })

  test('validates the email on blur, before the form is submitted', async ({
    authApi,
    loginPage,
  }) => {
    // Arrange
    await loginPage.goto()
    await loginPage.fillEmail('still-not-an-email')

    // Act — moving focus to the password field blurs the email input
    await loginPage.passwordInput.click()

    // Assert
    await loginPage.expectEmailError('Enter a valid email address.')
    expect(authApi.signInRequests).toHaveLength(0)
  })

  test('clears the email error as soon as the value becomes valid', async ({
    authApi,
    loginPage,
  }) => {
    // Arrange
    await loginPage.goto()
    await loginPage.fillCredentials({ email: 'invalid', password: account.password })
    await loginPage.submit()
    await loginPage.expectEmailError('Enter a valid email address.')

    // Act
    await loginPage.fillEmail(account.user.email)

    // Assert
    await loginPage.expectNoEmailError()
    expect(authApi.signInRequests).toHaveLength(0)
  })
})
