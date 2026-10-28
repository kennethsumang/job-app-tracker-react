import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Page object for a single application (`/app/applications/:id`).
 *
 * Models the header card, the top-bar actions (edit, change status, delete),
 * the interviews section and the result snackbar.
 */
export class ApplicationDetailPage {
  readonly page: Page
  readonly backButton: Locator
  readonly editButton: Locator
  readonly changeStatusButton: Locator
  readonly deleteButton: Locator
  readonly addInterviewButton: Locator
  readonly addInterviewEmptyButton: Locator

  constructor(page: Page) {
    this.page = page
    this.backButton = page.getByRole('button', { name: 'Back to applications' })
    this.editButton = page.getByRole('button', {
      name: 'Edit application',
      exact: true,
    })
    this.changeStatusButton = page.getByRole('button', {
      name: 'Change status',
      exact: true,
    })
    this.deleteButton = page.getByRole('button', {
      name: 'Delete application',
      exact: true,
    })
    this.addInterviewButton = page.getByRole('button', {
      name: 'Add',
      exact: true,
    })
    this.addInterviewEmptyButton = page.getByRole('button', {
      name: 'Add interview',
      exact: true,
    })
  }

  /** Navigates straight to the detail page of an application. */
  async goto(id: string): Promise<void> {
    await this.page.goto(`/app/applications/${id}`)
  }

  /** Header-card title, i.e. the company name rendered as an `h5`. */
  companyHeading(company: string): Locator {
    return this.page.getByRole('heading', { level: 5, name: company })
  }

  /** Position title shown under the company name in the header card. */
  position(positionTitle: string): Locator {
    return this.page.getByText(positionTitle, { exact: true })
  }

  /**
   * Status chip rendered by the header card.
   *
   * Addressed by its `MuiChip-label` because the info card repeats the
   * "Applied"/"Created" row labels as plain text.
   */
  statusChip(status: string): Locator {
    return this.page.locator('.MuiChip-label').filter({ hasText: status })
  }

  /** Edit action of an interview card, addressed by its translated type. */
  editInterviewButton(typeLabel: string): Locator {
    return this.page.getByRole('button', {
      name: `Edit ${typeLabel} interview`,
    })
  }

  /** Delete action of an interview card, addressed by its translated type. */
  deleteInterviewButton(typeLabel: string): Locator {
    return this.page.getByRole('button', {
      name: `Delete ${typeLabel} interview`,
    })
  }

  /** Asserts the detail page of the expected application is on screen. */
  async expectLoaded(company: string, positionTitle: string): Promise<void> {
    await expect(this.page).toHaveURL(/\/app\/applications\/[^/?]+$/)
    await expect(this.companyHeading(company)).toBeVisible()
    await expect(this.position(positionTitle)).toBeVisible()
    await expect(this.backButton).toBeVisible()
  }

  /** Asserts the page's result snackbar shows the given message. */
  async expectSnackbar(message: string): Promise<void> {
    await expect(this.page.getByText(message, { exact: true })).toBeVisible()
  }

  /** Opens the edit dialog from the top bar. */
  async openEdit(): Promise<void> {
    await this.editButton.click()
  }

  /** Opens the status-change dialog from the top bar. */
  async openStatusChange(): Promise<void> {
    await this.changeStatusButton.click()
  }

  /** Opens the delete confirmation from the top bar. */
  async openDelete(): Promise<void> {
    await this.deleteButton.click()
  }

  /** Opens the interview form (works with or without existing interviews). */
  async openAddInterview(): Promise<void> {
    await this.addInterviewButton.click()
  }

  /** Asserts the interviews section shows its empty state. */
  async expectNoInterviews(): Promise<void> {
    await expect(
      this.page.getByText('No interviews yet', { exact: true }),
    ).toBeVisible()
  }
}
