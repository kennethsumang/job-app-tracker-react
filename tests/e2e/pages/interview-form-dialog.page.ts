import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Page object for the interview form dialog in create mode
 * (`Add Interview`).
 */
export class InterviewFormDialogPage {
  readonly page: Page
  readonly dialog: Locator
  readonly typeSelect: Locator
  readonly scheduledAtInput: Locator
  readonly timezoneSelect: Locator
  readonly locationInput: Locator
  readonly notesInput: Locator
  readonly createButton: Locator
  readonly cancelButton: Locator
  readonly scheduledAtError: Locator

  constructor(page: Page) {
    this.page = page
    this.dialog = page.getByRole('dialog', { name: 'Add Interview' })
    this.typeSelect = this.dialog.getByRole('combobox', {
      name: 'Interview type',
    })
    /* MUI appends an (aria-hidden) asterisk to required labels. */
    this.scheduledAtInput = this.dialog.getByLabel(/^Scheduled date & time/)
    this.timezoneSelect = this.dialog.getByRole('combobox', {
      name: 'Timezone',
    })
    this.locationInput = this.dialog.getByLabel(/^Location/)
    this.notesInput = this.dialog.getByLabel(/^Notes/)
    this.createButton = this.dialog.getByRole('button', {
      name: 'Add interview',
      exact: true,
    })
    this.cancelButton = this.dialog.getByRole('button', {
      name: 'Cancel',
      exact: true,
    })
    this.scheduledAtError = this.dialog.getByText(
      'Scheduled date & time is required.',
      { exact: true },
    )
  }

  /** Asserts the dialog is open. */
  async expectOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible()
    await expect(this.typeSelect).toBeVisible()
    await expect(this.createButton).toBeEnabled()
  }

  /** Asserts the dialog is closed (or not mounted at all). */
  async expectClosed(): Promise<void> {
    await expect(this.dialog).toBeHidden()
  }

  /** Picks the interview type. */
  async chooseType(label: string): Promise<void> {
    await this.typeSelect.click()
    await this.page.getByRole('option', { name: label, exact: true }).click()
  }

  /** Fills the scheduled date & time (`YYYY-MM-DDTHH:mm`). */
  async fillScheduledAt(value: string): Promise<void> {
    await this.scheduledAtInput.fill(value)
  }

  /** Picks the interview timezone. */
  async chooseTimezone(zone: string): Promise<void> {
    await this.timezoneSelect.click()
    await this.page.getByRole('option', { name: zone, exact: true }).click()
  }

  async fillLocation(location: string): Promise<void> {
    await this.locationInput.fill(location)
  }

  async fillNotes(notes: string): Promise<void> {
    await this.notesInput.fill(notes)
  }

  /** Submits the form (creating the interview). */
  async submit(): Promise<void> {
    await this.createButton.click()
  }

  /** Dismisses the dialog without saving. */
  async cancel(): Promise<void> {
    await this.cancelButton.click()
  }

  /** Asserts the scheduled-at required error is shown. */
  async expectScheduledAtRequired(): Promise<void> {
    await expect(this.scheduledAtError).toBeVisible()
  }
}
