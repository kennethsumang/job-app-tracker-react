import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Page object for the applications list (`/app/applications`).
 *
 * The dashboard links into this page, and the specs also navigate here directly,
 * so this page object models the search field, the filter drawer (status chips +
 * the deleted-applications switch), pagination and the list's loading/empty/
 * error states.
 */
export class ApplicationsListPage {
  readonly page: Page
  readonly heading: Locator
  readonly searchInput: Locator
  readonly emptyState: Locator
  readonly retryButton: Locator
  readonly errorMessage: Locator
  readonly openFiltersButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { level: 1, name: 'Applications' })
    this.searchInput = page.getByPlaceholder('Search company or position…')
    this.emptyState = page.getByText('No applications yet.', { exact: true })
    this.retryButton = page.getByRole('button', { name: 'Try again' })
    /* The failure state prints the API message, and the API error text is not
     * fixed copy, so it is matched loosely. */
    this.errorMessage = page.getByText(
      /Failed to load|unavailable|Network request failed|Internal server error|Unable to reach|Request timed out/i,
    )
    this.openFiltersButton = page.getByRole('button', { name: 'Open filters' })
  }

  /** All application cards currently rendered. */
  get cards(): Locator {
    return this.page.getByRole('button', { name: /^View details for / })
  }

  /** Card of a single application, addressed by its company name. */
  card(company: string): Locator {
    return this.page.getByRole('button', { name: `View details for ${company}` })
  }

  /** Floating action button that opens the quick create dialog. */
  get addApplicationButton(): Locator {
    return this.page.getByRole('button', {
      name: 'Add application',
      exact: true,
    })
  }

  /** "Edit application" action of the given card. */
  editButton(company: string): Locator {
    return this.card(company).getByRole('button', {
      name: 'Edit application',
      exact: true,
    })
  }

  /** "Delete application" action of the given card. */
  deleteButton(company: string): Locator {
    return this.card(company).getByRole('button', {
      name: 'Delete application',
      exact: true,
    })
  }

  /** Opens the quick create dialog from the floating action button. */
  async openAddApplication(): Promise<void> {
    await this.addApplicationButton.click()
  }

  /** The filter drawer, unique among the app's drawers by its Apply action. */
  get filtersDrawer(): Locator {
    return this.page.locator('.MuiDrawer-paper').filter({
      has: this.page.getByRole('button', { name: 'Apply filters', exact: true }),
    })
  }

  /** The "Include deleted applications" switch inside the filter drawer. */
  get includeDeletedSwitch(): Locator {
    return this.filtersDrawer.getByRole('switch', {
      name: 'Include deleted applications',
    })
  }

  /** The "Clear all filters" action in the filter bar. */
  get clearAllFiltersButton(): Locator {
    return this.page.getByRole('button', {
      name: 'Clear all filters',
      exact: true,
    })
  }

  /** Pagination landmark rendered when the result spans several pages. */
  get pagination(): Locator {
    return this.page.getByRole('navigation', { name: 'Application pages' })
  }

  /** Navigates straight to the list (bypassing the login form). */
  async goto(path = '/app/applications'): Promise<void> {
    await this.page.goto(path)
    await this.expectLoaded()
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

  /** Asserts the list is showing its empty state (default or deleted copy). */
  async expectEmptyState(message = 'No applications yet.'): Promise<void> {
    await expect(this.page.getByText(message, { exact: true })).toBeVisible()
    await expect(this.cards).toHaveCount(0)
  }

  /** Asserts the page's result snackbar shows the given message. */
  async expectSnackbar(message: string): Promise<void> {
    await expect(this.page.getByText(message, { exact: true })).toBeVisible()
  }

  /** Types into the search box (the filters update after a short debounce). */
  async search(term: string): Promise<void> {
    await this.searchInput.fill(term)
  }

  /** Opens the filter drawer. */
  async openFilters(): Promise<void> {
    await this.openFiltersButton.click()
    await expect(this.filtersDrawer).toBeVisible()
  }

  /** Toggles a status chip in the filter drawer by its translated label. */
  async toggleStatus(label: string): Promise<void> {
    await this.filtersDrawer
      .getByRole('button', { name: label, exact: true })
      .click()
  }

  /** Sets the "Include deleted applications" switch to the given state. */
  async setIncludeDeleted(checked: boolean): Promise<void> {
    if ((await this.includeDeletedSwitch.isChecked()) !== checked) {
      await this.includeDeletedSwitch.click()
    }
  }

  /** Applies the drawer's draft filters and closes it. */
  async applyFilters(): Promise<void> {
    await this.filtersDrawer
      .getByRole('button', { name: 'Apply filters', exact: true })
      .click()
  }

  /** Clears every filter with the filter bar's one-click action. */
  async clearAllFilters(): Promise<void> {
    await this.clearAllFiltersButton.click()
  }

  /** Goes to the given pagination page. */
  async goToPage(pageNumber: number): Promise<void> {
    await this.pagination
      .getByRole('button', { name: `Go to page ${pageNumber}` })
      .click()
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
