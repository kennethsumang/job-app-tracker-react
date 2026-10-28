import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Page object for the soft-delete confirmation dialog
 * (`Delete application?`).
 */
export class DeleteApplicationDialogPage {
  readonly page: Page
  readonly dialog: Locator
  readonly confirmButton: Locator
  readonly cancelButton: Locator

  constructor(page: Page) {
    this.page = page
    this.dialog = page.getByRole('dialog', { name: 'Delete application?' })
    this.confirmButton = this.dialog.getByRole('button', {
      name: 'Delete',
      exact: true,
    })
    this.cancelButton = this.dialog.getByRole('button', {
      name: 'Cancel',
      exact: true,
    })
  }

  /** Asserts the dialog is open and mentions the application's company. */
  async expectOpen(companyName: string): Promise<void> {
    await expect(this.dialog).toBeVisible()
    await expect(this.dialog).toContainText(companyName)
    await expect(this.confirmButton).toBeEnabled()
  }

  /** Asserts the dialog is closed (or not mounted at all). */
  async expectClosed(): Promise<void> {
    await expect(this.dialog).toBeHidden()
  }

  /** Confirms the deletion. */
  async confirm(): Promise<void> {
    await this.confirmButton.click()
  }

  /** Dismisses the dialog without deleting. */
  async cancel(): Promise<void> {
    await this.cancelButton.click()
  }
}
