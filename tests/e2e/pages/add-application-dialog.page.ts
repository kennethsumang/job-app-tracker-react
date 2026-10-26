import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Page object for the "Add Application" dialog opened from the dashboard
 * quick action (`CreateApplicationFormDialog`).
 *
 * Only the required basics plus the two optional selects are modelled. The
 * dashboard remounts the dialog on every opening, so a cancelled dialog always
 * reopens empty — which one of the specs asserts.
 */
export class AddApplicationDialogPage {
  readonly page: Page
  readonly dialog: Locator
  readonly companyInput: Locator
  readonly positionInput: Locator
  readonly employmentTypeSelect: Locator
  readonly workplaceTypeSelect: Locator
  readonly cancelButton: Locator
  readonly createButton: Locator
  readonly companyError: Locator
  readonly positionError: Locator

  constructor(page: Page) {
    this.page = page
    this.dialog = page.getByRole('dialog', { name: 'New Application' })
    /* MUI appends an (aria-hidden) asterisk to required labels, so the field
     * labels are matched by prefix instead of exactly. */
    this.companyInput = this.dialog.getByRole('textbox', {
      name: /^Company name/,
    })
    this.positionInput = this.dialog.getByRole('textbox', {
      name: /^Position title/,
    })
    this.employmentTypeSelect = this.dialog.getByRole('combobox', {
      name: /^Employment type/,
    })
    this.workplaceTypeSelect = this.dialog.getByRole('combobox', {
      name: /^Workplace/,
    })
    this.cancelButton = this.dialog.getByRole('button', {
      name: 'Cancel',
      exact: true,
    })
    /* The "Create" label is replaced by a spinner while the request is in
     * flight, so the footer button is addressed positionally (Cancel comes
     * first, Create last). */
    this.createButton = this.dialog.getByRole('button').last()
    this.companyError = this.dialog.getByText('Company name is required.', {
      exact: true,
    })
    this.positionError = this.dialog.getByText('Position title is required.', {
      exact: true,
    })
  }

  /** Asserts the dialog is open and ready for input. */
  async expectOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible()
    await expect(this.companyInput).toBeVisible()
    await expect(this.positionInput).toBeVisible()
    await expect(this.createButton).toBeEnabled()
  }

  /** Asserts the dialog is closed (or not mounted at all). */
  async expectClosed(): Promise<void> {
    await expect(this.dialog).toBeHidden()
  }

  /** Asserts the dialog is saving: still open, both actions disabled. */
  async expectSaving(): Promise<void> {
    await expect(this.dialog).toBeVisible()
    await expect(this.createButton).toBeDisabled()
    await expect(this.cancelButton).toBeDisabled()
  }

  async fillCompany(companyName: string): Promise<void> {
    await this.companyInput.fill(companyName)
  }

  async fillPosition(positionTitle: string): Promise<void> {
    await this.positionInput.fill(positionTitle)
  }

  /** Fills the two required fields. */
  async fillBasics(companyName: string, positionTitle: string): Promise<void> {
    await this.fillCompany(companyName)
    await this.fillPosition(positionTitle)
  }

  /** Picks an employment type from the optional select. */
  async chooseEmploymentType(label: string): Promise<void> {
    await this.employmentTypeSelect.click()
    await this.page.getByRole('option', { name: label, exact: true }).click()
  }

  /** Picks a workplace type from the optional select. */
  async chooseWorkplaceType(label: string): Promise<void> {
    await this.workplaceTypeSelect.click()
    await this.page.getByRole('option', { name: label, exact: true }).click()
  }

  /** Submits the form (creating the application). */
  async submit(): Promise<void> {
    await this.createButton.click()
  }

  /** Dismisses the dialog without saving. */
  async cancel(): Promise<void> {
    await this.cancelButton.click()
  }

  /** Asserts both required-field messages are shown. */
  async expectRequiredErrors(): Promise<void> {
    await expect(this.companyError).toBeVisible()
    await expect(this.positionError).toBeVisible()
  }
}
