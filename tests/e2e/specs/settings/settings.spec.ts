import { expect, test } from '../../fixtures'
import { TEST_ACCOUNTS } from '../../fixtures/users'

/**
 * Settings page (`/app/settings`) coverage.
 *
 * Asserts the authenticated user can see their account summary, update the
 * default currency, change their password, sign out and delete their account.
 */

const account = TEST_ACCOUNTS.verified

test.describe('Settings', () => {
  test.beforeEach(async ({ authApi }) => {
    authApi.authenticateAs(account.user)
  })

  test('loads the settings sections for an authenticated user', async ({
    settingsApi,
    settingsPage,
  }) => {
    // Act
    await settingsPage.goto()

    // Assert — every section and the account summary are visible
    await settingsPage.expectEmail(account.user.email)
    await settingsPage.expectCurrency(settingsApi.settings.defaultCurrency)
  })

  test('updates the default currency', async ({
    settingsApi,
    settingsPage,
  }) => {
    // Act
    await settingsPage.goto()
    await settingsPage.selectCurrency('EUR')

    // Assert — the result snackbar and the refreshed currency row
    await settingsPage.expectSnackbar('Currency updated.')
    await settingsPage.expectCurrency('EUR')
    expect(settingsApi.updateRequests).toContainEqual({ defaultCurrency: 'EUR' })
  })

  test('signs out from the session section', async ({ settingsPage }) => {
    // Act
    await settingsPage.goto()
    await settingsPage.signOut()

    // Assert — the user is returned to the sign-in screen
    await expect(settingsPage.page).toHaveURL(/\/$/)
  })

  test('changes the password and returns to sign-in', async ({
    authApi,
    settingsPage,
  }) => {
    // Act
    await settingsPage.goto()
    await settingsPage.openChangePassword()
    await settingsPage.submitChangePassword('OldPassword123!', 'NewPassword456!')

    // Assert — signed out, and the mock received the submitted passwords
    await expect(settingsPage.page).toHaveURL(/\/$/)
    expect(authApi.changePasswordRequests).toHaveLength(1)
    expect(authApi.changePasswordRequests[0].payload).toEqual({
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword456!',
    })
  })

  test('validates the change-password form before submitting', async ({
    authApi,
    settingsPage,
  }) => {
    // Arrange
    await settingsPage.goto()
    await settingsPage.openChangePassword()
    const dialog = settingsPage.page.getByRole('dialog', {
      name: 'Change Password',
    })

    // Act — submit without typing anything
    await dialog.getByRole('button', { name: 'Save', exact: true }).click()

    // Assert — field-level errors and no request sent
    await expect(
      dialog.getByText('Enter your current password.', { exact: true }),
    ).toBeVisible()
    await expect(
      dialog.getByText('Enter a new password.', { exact: true }),
    ).toBeVisible()
    expect(authApi.changePasswordRequests).toHaveLength(0)
  })

  test('deletes all data and returns to sign-in', async ({
    settingsApi,
    settingsPage,
  }) => {
    // Act
    await settingsPage.goto()
    await settingsPage.deleteAllData()

    // Assert — account deletion reached the API and the user is signed out
    await expect(settingsPage.page).toHaveURL(/\/$/)
    expect(settingsApi.deleteAccountCalls).toBe(1)
  })
})
