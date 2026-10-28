import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Page object for the status-change dialog (`Change status`).
 */
export class StatusChangeDialogPage {
  readonly page: Page
  readonly dialog: Locator
  readonly statusSelect: Locator
  readonly changedOnInput: Locator
  readonly saveButton: Locator
  readonly cancelButton: Locator
  readonly changedOnError: Locator

  constructor(page: Page) {
    this.page = page
    this.dialog = page.getByRole('dialog', { name: 'Change status' })
    this.statusSelect = this.dialog.getByRole('combobox', {
      name: 'New status',
    })
    /* MUI appends an (aria-hidden) asterisk to required labels. */
    this.changedOnInput = this.dialog.getByLabel(/^Changed on/)
    this.saveButton = this.dialog.getByRole('button', {
      name: 'Save',
      exact: true,
    })
    this.cancelButton = this.dialog.getByRole('button', {
      name: 'Cancel',
      exact: true,
    })
    this.changedOnError = this.dialog.getByText('Changed on is required.', {
      exact: true,
    })
  }

  /** Asserts the dialog is open. */
  async expectOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible()
    await expect(this.statusSelect).toBeVisible()
    await expect(this.saveButton).toBeEnabled()
  }

  /** Asserts the dialog is closed (or not mounted at all). */
  async expectClosed(): Promise<void> {
    await expect(this.dialog).toBeHidden()
  }

  /** Picks the new status from the select. */
  async chooseStatus(label: string): Promise<void> {
    await this.statusSelect.click()
    await this.page.getByRole('option', { name: label, exact: true }).click()
  }

  /** Overrides the "changed on" date. */
  async fillChangedOn(value: string): Promise<void> {
    await this.changedOnInput.fill(value)
  }

  /** Saves the status change. */
  async save(): Promise<void> {
    await this.saveButton.click()
  }

  /** Dismisses the dialog without saving. */
  async cancel(): Promise<void> {
    await this.cancelButton.click()
  }

  /** Asserts the "changed on" required error is shown. */
  async expectChangedOnRequired(): Promise<void> {
    await expect(this.changedOnError).toBeVisible()
  }
}
