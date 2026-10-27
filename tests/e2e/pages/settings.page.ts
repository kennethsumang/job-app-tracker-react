import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Page object for the settings page (`/app/settings`).
 *
 * Models the account summary, the change-password dialog, the currency picker,
 * the session sign-out and the account-deletion flows. Selectors are
 * role/label based (the app ships no `data-testid` attributes).
 */
export class SettingsPage {
  readonly page: Page
  readonly heading: Locator
  readonly changePasswordButton: Locator
  readonly currencyButton: Locator
  readonly deleteAllDataButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Settings' })
    /* ListItemText renders primary + secondary into the button's accessible
     * name, so entries with a description are matched by prefix. */
    this.changePasswordButton = page.getByRole('button', {
      name: 'Change Password',
      exact: true,
    })
    this.currencyButton = page.getByRole('button', { name: /^Currency/ })
    this.deleteAllDataButton = page.getByRole('button', {
      name: /^Delete All Data/,
    })
  }

  /** "Sign Out" inside the settings page (the shell has its own). */
  get signOutButton(): Locator {
    return this.page
      .locator('#main-content')
      .getByRole('button', { name: 'Sign Out', exact: true })
  }

  /** Navigates to the settings page and waits for it to render. */
  async goto(path = '/app/settings'): Promise<void> {
    await this.page.goto(path)
    await this.expectLoaded()
  }

  /** Asserts the settings page is fully rendered. */
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/app\/settings$/)
    await expect(this.heading).toBeVisible()
    await expect(this.changePasswordButton).toBeVisible()
    await expect(this.currencyButton).toBeVisible()
    await expect(this.signOutButton).toBeVisible()
    await expect(this.deleteAllDataButton).toBeVisible()
  }

  /** Asserts the account section shows the given email. */
  async expectEmail(email: string): Promise<void> {
    await expect(this.page.getByText(email, { exact: true })).toBeVisible()
  }

  /** Asserts the currency row shows the given code. */
  async expectCurrency(code: string): Promise<void> {
    await expect(this.currencyButton).toContainText(code)
  }

  /** Opens the currency picker and selects a currency. */
  async selectCurrency(code: string): Promise<void> {
    await this.currencyButton.click()
    const dialog = this.page.getByRole('dialog', { name: 'Select Currency' })
    await dialog.getByRole('button', { name: code, exact: true }).click()
  }

  /** Asserts the result snackbar shows the given message. */
  async expectSnackbar(message: string): Promise<void> {
    await expect(this.page.getByText(message, { exact: true })).toBeVisible()
  }

  /** Opens the change-password dialog. */
  async openChangePassword(): Promise<void> {
    await this.changePasswordButton.click()
  }

  /** Fills the change-password dialog and submits it. */
  async submitChangePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const dialog = this.page.getByRole('dialog', { name: 'Change Password' })
    await dialog.getByLabel('Current password', { exact: true }).fill(currentPassword)
    await dialog.getByLabel('New password', { exact: true }).fill(newPassword)
    await dialog
      .getByLabel('Confirm new password', { exact: true })
      .fill(newPassword)
    await dialog.getByRole('button', { name: 'Save', exact: true }).click()
  }

  /** Confirms sign-out from the session section. */
  async signOut(): Promise<void> {
    await this.signOutButton.click()
    const dialog = this.page.getByRole('dialog', { name: 'Sign Out?' })
    await dialog.getByRole('button', { name: 'Sign Out', exact: true }).click()
  }

  /** Confirms the account-deletion flow. */
  async deleteAllData(): Promise<void> {
    await this.deleteAllDataButton.click()
    const dialog = this.page.getByRole('dialog', { name: 'Delete All Data?' })
    await dialog
      .getByRole('button', { name: 'Delete Everything', exact: true })
      .click()
  }
}
