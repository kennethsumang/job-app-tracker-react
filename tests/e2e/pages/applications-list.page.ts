import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Page object for the applications list (`/app/applications`).
 *
 * The dashboard links into this page, so the specs assert what the list ends up
 * rendering: the heading, the filter bar and the cards the API returned.
 */
export class ApplicationsListPage {
  readonly page: Page
  readonly heading: Locator
  readonly searchInput: Locator
  readonly emptyState: Locator
  readonly retryButton: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { level: 1, name: 'Applications' })
    this.searchInput = page.getByPlaceholder('Search company or position…')
    this.emptyState = page.getByText('No applications yet.', { exact: true })
    this.retryButton = page.getByRole('button', { name: 'Try again' })
    /* The failure state prints the API message, and the API error text is not
     * fixed copy, so it is matched loosely. */
    this.errorMessage = page.getByText(
      /Failed to load|unavailable|Network request failed|Internal server error/i,
    )
  }

  /** All application cards currently rendered. */
  get cards(): Locator {
    return this.page.getByRole('button', { name: /^View details for / })
  }

  /** Card of a single application, addressed by its company name. */
  card(company: string): Locator {
    return this.page.getByRole('button', { name: `View details for ${company}` })
  }

  /** Asserts the list finished loading and is on screen. */
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/app\/applications$/)
    await expect(this.heading).toBeVisible()
    await expect(this.searchInput).toBeVisible()
  }

  /** Asserts exactly the given companies are listed, in display order. */
  async expectCompanies(companies: readonly string[]): Promise<void> {
    await expect(this.cards).toHaveCount(companies.length)

    for (const [index, company] of companies.entries()) {
      await expect(this.cards.nth(index)).toHaveAccessibleName(
        `View details for ${company}`,
      )
    }
  }

  /** Asserts the list is showing its failure state. */
  async expectLoadError(): Promise<void> {
    await expect(this.errorMessage).toBeVisible()
    await expect(this.retryButton).toBeVisible()
    await expect(this.cards).toHaveCount(0)
  }

  /** Retries the failed list request. */
  async retry(): Promise<void> {
    await this.retryButton.click()
  }

  /**
   * Returns to the dashboard through the app shell navigation.
   *
   * This is a client-side navigation (unlike `page.goto`), so the SPA keeps its
   * in-memory filter store — which is what the dashboard round-trip journeys
   * are about. The shell renders the entry twice (sidebar and mobile bottom
   * bar), so the visible one is used.
   */
  async goBackToDashboard(): Promise<void> {
    await this.page
      .getByRole('button', { name: 'Dashboard', exact: true })
      .filter({ visible: true })
      .click()
  }
}
