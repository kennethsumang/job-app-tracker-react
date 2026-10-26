import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Page object for a single application (`/app/applications/:id`).
 *
 * The dashboard's upcoming-interview card links here, so the specs assert the
 * company/position of the application the interview belongs to.
 */
export class ApplicationDetailPage {
  readonly page: Page
  readonly backButton: Locator

  constructor(page: Page) {
    this.page = page
    this.backButton = page.getByRole('button', { name: 'Back to applications' })
  }

  /** Header-card title, i.e. the company name rendered as an `h5`. */
  companyHeading(company: string): Locator {
    return this.page.getByRole('heading', { level: 5, name: company })
  }

  /** Position title shown under the company name in the header card. */
  position(positionTitle: string): Locator {
    return this.page.getByText(positionTitle, { exact: true })
  }

  /** Asserts the detail page of the expected application is on screen. */
  async expectLoaded(company: string, positionTitle: string): Promise<void> {
    await expect(this.page).toHaveURL(/\/app\/applications\/[^/?]+$/)
    await expect(this.companyHeading(company)).toBeVisible()
    await expect(this.position(positionTitle)).toBeVisible()
    await expect(this.backButton).toBeVisible()
  }
}
