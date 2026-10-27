import { expect, test } from '../../fixtures'
import { TEST_ACCOUNTS } from '../../fixtures/users'

/**
 * Shell language switcher coverage.
 *
 * The switcher is rendered by `AppLayout`, so it is available on every
 * authenticated route. This spec asserts the visible labels, the language
 * change, and the side effects handled by the i18n listener (document language
 * and localStorage persistence).
 */
const account = TEST_ACCOUNTS.verified

test.describe('Language switcher', () => {
  test.beforeEach(async ({ authApi }) => {
    authApi.authenticateAs(account.user)
  })

  test('switches the interface language and persists the choice', async ({
    dashboardPage,
    page,
  }) => {
    // Arrange — start in the default English locale.
    await dashboardPage.goto()
    const languageSelect = page.getByRole('combobox', { name: 'Language' })
    await expect(languageSelect).toContainText('English (US)')

    // Act — choose Spanish from the dropdown.
    await languageSelect.click()
    await page.getByRole('option', { name: 'Español' }).click()

    // Assert — the control, document language, and storage all follow.
    await expect(
      page.getByRole('combobox', { name: 'Idioma' }),
    ).toContainText('Español')
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem('job-app-tracker.language')),
      )
      .toBe('es')

    // Assert — the shell navigation and sign-out action are translated too.
    const sidebar = page.locator('.MuiDrawer-paper')
    await expect(
      sidebar.getByRole('button', { name: 'Candidaturas' }),
    ).toBeVisible()
    await expect(
      sidebar.getByRole('button', { name: 'Cerrar sesión' }),
    ).toBeVisible()
  })
})
