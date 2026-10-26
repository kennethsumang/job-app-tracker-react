import { expect, test } from '../../../fixtures'
import { NEW_ACCOUNT } from '../../../fixtures/users'

/**
 * Client-side validation of the registration form.
 *
 * The form is `noValidate`, so every assertion covers the app's own Zod
 * validator. Validation failures must never reach the network.
 */

const registration = {
  ...NEW_ACCOUNT,
  confirmPassword: NEW_ACCOUNT.password,
}

test.describe('Register validation', () => {
  test('shows a required-field error for every input when submitted empty', async ({
    authApi,
    registerPage,
  }) => {
    // Arrange
    await registerPage.goto()

    // Act
    await registerPage.submitEmpty()

    // Assert
    await registerPage.expectNameError('Name is required.')
    await registerPage.expectEmailError('Email is required.')
    await registerPage.expectPasswordError('Password is required.')
    await registerPage.expectConfirmPasswordError('Please confirm your password.')
    expect(authApi.signUpRequests).toHaveLength(0)
  })

  test('rejects a malformed email address', async ({ authApi, registerPage }) => {
    // Arrange
    await registerPage.goto()

    // Act
    await registerPage.signUp({ ...registration, email: 'not-an-email' })

    // Assert
    await registerPage.expectEmailError('Enter a valid email address.')
    expect(authApi.signUpRequests).toHaveLength(0)
  })

  test('rejects a password shorter than eight characters', async ({
    authApi,
    registerPage,
  }) => {
    // Arrange
    await registerPage.goto()

    // Act
    await registerPage.signUp({
      ...registration,
      password: 'short',
      confirmPassword: 'short',
    })

    // Assert
    await registerPage.expectPasswordError(
      'Password must be at least 8 characters.',
    )
    await registerPage.expectNoConfirmPasswordError()
    expect(authApi.signUpRequests).toHaveLength(0)
  })

  test('rejects mismatched password confirmation', async ({
    authApi,
    registerPage,
  }) => {
    // Arrange
    await registerPage.goto()

    // Act
    await registerPage.signUp({
      ...registration,
      confirmPassword: 'DifferentPass123!',
    })

    // Assert
    await registerPage.expectConfirmPasswordError('Passwords do not match.')
    expect(authApi.signUpRequests).toHaveLength(0)
  })

  test('rejects a name longer than 128 characters', async ({
    authApi,
    registerPage,
  }) => {
    // Arrange
    await registerPage.goto()

    // Act
    await registerPage.signUp({ ...registration, name: 'a'.repeat(129) })

    // Assert
    await registerPage.expectNameError('Name must be 128 characters or fewer.')
    expect(authApi.signUpRequests).toHaveLength(0)
  })

  test('validates a field on blur, before the form is submitted', async ({
    authApi,
    registerPage,
  }) => {
    // Arrange
    await registerPage.goto()
    await registerPage.emailInput.fill('still-not-an-email')

    // Act — moving focus to the password field blurs the email input
    await registerPage.passwordInput.click()

    // Assert
    await registerPage.expectEmailError('Enter a valid email address.')
    expect(authApi.signUpRequests).toHaveLength(0)
  })

  test('clears the mismatch error as soon as the passwords agree', async ({
    authApi,
    registerPage,
  }) => {
    // Arrange
    await registerPage.goto()
    await registerPage.signUp({
      ...registration,
      confirmPassword: 'DifferentPass123!',
    })
    await registerPage.expectConfirmPasswordError('Passwords do not match.')

    // Act
    await registerPage.confirmPasswordInput.fill(registration.password)

    // Assert
    await registerPage.expectNoConfirmPasswordError()
    expect(authApi.signUpRequests).toHaveLength(0)
  })
})
