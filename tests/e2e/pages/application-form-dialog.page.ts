import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Page object for the two-step `ApplicationFormDialog` in edit mode
 * (`Edit Application`).
 *
 * Step 1 collects the required basics plus classification, step 2 the optional
 * details. The form is pre-filled from the application being edited.
 */
export class ApplicationFormDialogPage {
  readonly page: Page
  readonly dialog: Locator
  readonly companyInput: Locator
  readonly positionInput: Locator
  readonly employmentTypeSelect: Locator
  readonly workplaceTypeSelect: Locator
  readonly locationInput: Locator
  readonly websiteInput: Locator
  readonly salaryMinInput: Locator
  readonly salaryMaxInput: Locator
  readonly currencySelect: Locator
  readonly notesInput: Locator
  readonly nextButton: Locator
  readonly saveButton: Locator
  readonly cancelButton: Locator
  readonly backButton: Locator

  constructor(page: Page) {
    this.page = page
    this.dialog = page.getByRole('dialog', { name: 'Edit Application' })
    /* MUI appends an (aria-hidden) asterisk to required labels, so field labels
     * are matched by prefix. */
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
    this.locationInput = this.dialog.getByRole('textbox', {
      name: /^Location/,
    })
    this.websiteInput = this.dialog.getByRole('textbox', {
      name: /^Company website/,
    })
    this.salaryMinInput = this.dialog.getByRole('spinbutton', {
      name: /^Salary min/,
    })
    this.salaryMaxInput = this.dialog.getByRole('spinbutton', {
      name: /^Salary max/,
    })
    this.currencySelect = this.dialog.getByRole('combobox', {
      name: /^Currency/,
    })
    this.notesInput = this.dialog.getByRole('textbox', { name: /^Notes/ })
    this.nextButton = this.dialog.getByRole('button', { name: 'Next', exact: true })
    this.saveButton = this.dialog.getByRole('button', { name: 'Save', exact: true })
    this.cancelButton = this.dialog.getByRole('button', {
      name: 'Cancel',
      exact: true,
    })
    this.backButton = this.dialog.getByRole('button', { name: 'Back', exact: true })
  }

  /**
   * The primary action of the current step (`Next` on step 1, `Save` on step
   * 2). Addressed positionally because its label is replaced by a spinner
   * while the request is in flight.
   */
  get submitButton(): Locator {
    return this.dialog.getByRole('button').last()
  }

  /** Asserts the dialog is open. */
  async expectOpen(): Promise<void> {
    await expect(this.dialog).toBeVisible()
  }

  /** Asserts the dialog is closed (or not mounted at all). */
  async expectClosed(): Promise<void> {
    await expect(this.dialog).toBeHidden()
  }

  /** Asserts the basics are pre-filled with the application being edited. */
  async expectPrefilledBasics(
    companyName: string,
    positionTitle: string,
  ): Promise<void> {
    await expect(this.companyInput).toHaveValue(companyName)
    await expect(this.positionInput).toHaveValue(positionTitle)
  }

  async fillCompany(companyName: string): Promise<void> {
    await this.companyInput.fill(companyName)
  }

  async fillPosition(positionTitle: string): Promise<void> {
    await this.positionInput.fill(positionTitle)
  }

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

  /** Fills the optional step-2 fields. */
  async fillDetails(details: {
    location?: string
    website?: string
    salaryMin?: string
    salaryMax?: string
    currency?: string
    notes?: string
  }): Promise<void> {
    if (details.location !== undefined) {
      await this.locationInput.fill(details.location)
    }
    if (details.website !== undefined) {
      await this.websiteInput.fill(details.website)
    }
    if (details.salaryMin !== undefined) {
      await this.salaryMinInput.fill(details.salaryMin)
    }
    if (details.salaryMax !== undefined) {
      await this.salaryMaxInput.fill(details.salaryMax)
    }
    if (details.currency !== undefined) {
      await this.currencySelect.click()
      await this.page.getByRole('option', { name: details.currency, exact: true }).click()
    }
    if (details.notes !== undefined) {
      await this.notesInput.fill(details.notes)
    }
  }

  /** Advances to the details step. */
  async next(): Promise<void> {
    await this.nextButton.click()
  }

  /** Saves the edit from the details step. */
  async save(): Promise<void> {
    await this.saveButton.click()
  }

  /** Dismisses the dialog without saving. */
  async cancel(): Promise<void> {
    await this.cancelButton.click()
  }

  /** Goes back to the basics step. */
  async back(): Promise<void> {
    await this.backButton.click()
  }

  /** Asserts the form is saving: open with the primary action disabled. */
  async expectSaving(): Promise<void> {
    await expect(this.dialog).toBeVisible()
    await expect(this.submitButton).toBeDisabled()
    await expect(this.cancelButton).toBeDisabled()
  }
}
