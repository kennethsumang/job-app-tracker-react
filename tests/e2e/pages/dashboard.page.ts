import { expect, type Locator, type Page } from '@playwright/test'

/** Dashboard counters rendered by the summary tiles. */
export interface DashboardSummary {
  total: number
  inProgress: number
}

/** Copy rendered by the upcoming-interview card. */
export interface UpcomingInterviewSummary {
  /** Translated interview type, e.g. `Technical`. */
  type: string
  /** Company the interview belongs to, e.g. `Globex`. */
  company: string
  /** Position title the interview is for. */
  position: string
}

/**
 * Page object for the authenticated dashboard (`/app`).
 *
 * Models the greeting, the two summary tiles, the upcoming-interview card and
 * the sign-out action. The "Add Application" quick action is intentionally not
 * modelled because that feature is still being reworked.
 */
export class DashboardPage {
  readonly page: Page
  readonly heading: Locator
  readonly subtitle: Locator
  readonly signOutButton: Locator
  readonly summarySection: Locator
  readonly quickActionsSection: Locator
  readonly upcomingInterviewSection: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { level: 1, name: 'Welcome back!' })
    this.subtitle = page.getByText('Track and manage your job applications.', {
      exact: true,
    })
    this.signOutButton = page.getByRole('button', {
      name: 'Sign Out',
      exact: true,
    })
    this.summarySection = page.getByRole('region', {
      name: 'Application summary',
    })
    this.quickActionsSection = page.getByRole('region', {
      name: 'Quick Actions',
    })
    this.upcomingInterviewSection = page.getByRole('region', {
      name: 'Upcoming interview',
    })
  }

  /**
   * "Applications" summary tile.
   *
   * Its accessible name is `<label>: <count>`, so it is matched by prefix and
   * asserted with `toHaveAccessibleName` once the count is known.
   */
  get applicationsTile(): Locator {
    return this.summarySection.getByRole('button', { name: /^Applications: / })
  }

  /** "In Progress" summary tile (same naming convention as above). */
  get inProgressTile(): Locator {
    return this.summarySection.getByRole('button', { name: /^In Progress: / })
  }

  /** Upcoming-interview card; only rendered when the API returns one. */
  get upcomingInterviewCard(): Locator {
    return this.page.getByRole('button', { name: /^Next interview: / })
  }

  /** "Add Application" quick-action tile. */
  get addApplicationTile(): Locator {
    return this.quickActionsSection.getByRole('button', {
      name: 'Add Application',
      exact: true,
    })
  }

  /** Navigates straight to the dashboard (bypassing the login form). */
  async goto(path = '/app'): Promise<void> {
    await this.page.goto(path)
    await this.expectLoaded()
  }

  /** Asserts the dashboard is fully rendered for an authenticated user. */
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/app$/)
    await expect(this.heading).toBeVisible()
    await expect(this.subtitle).toBeVisible()
    await expect(this.summarySection).toBeVisible()
    await expect(this.signOutButton).toBeVisible()
  }

  /** Asserts the summary tiles show the mocked counters once loaded. */
  async expectSummary({ total, inProgress }: DashboardSummary): Promise<void> {
    await expect(this.applicationsTile).toHaveAccessibleName(
      `Applications: ${total}`,
    )
    await expect(this.inProgressTile).toHaveAccessibleName(
      `In Progress: ${inProgress}`,
    )
  }

  /**
   * Asserts both tiles are still waiting for their counts.
   *
   * While loading (and, currently, after a failed request) the tiles keep the
   * "loading" placeholder instead of a number.
   */
  async expectSummaryLoading(): Promise<void> {
    await expect(this.applicationsTile).toHaveAccessibleName(
      'Applications: loading',
    )
    await expect(this.inProgressTile).toHaveAccessibleName(
      'In Progress: loading',
    )
  }

  /** Asserts the upcoming-interview card shows the API's interview. */
  async expectUpcomingInterview({
    type,
    company,
    position,
  }: UpcomingInterviewSummary): Promise<void> {
    await expect(this.upcomingInterviewSection).toBeVisible()
    await expect(this.upcomingInterviewCard).toHaveAccessibleName(
      `Next interview: ${type} at ${company}`,
    )
    await expect(this.upcomingInterviewCard).toContainText('Next Interview')
    await expect(this.upcomingInterviewCard).toContainText(
      `${position} @ ${company}`,
    )
  }

  /** Asserts no upcoming interview is rendered (empty API response). */
  async expectNoUpcomingInterview(): Promise<void> {
    await expect(this.upcomingInterviewSection).toHaveCount(0)
  }

  /** Opens the applications list through the "Applications" tile. */
  async clickApplicationsTile(): Promise<void> {
    await this.applicationsTile.click()
  }

  /** Opens the filtered applications list through the "In Progress" tile. */
  async clickInProgressTile(): Promise<void> {
    await this.inProgressTile.click()
  }

  /** Opens the detail page of the upcoming interview's application. */
  async clickUpcomingInterview(): Promise<void> {
    await this.upcomingInterviewCard.click()
  }

  /** Opens the "Add Application" dialog. */
  async clickAddApplication(): Promise<void> {
    await this.addApplicationTile.click()
  }

  /** Asserts the quick-action snackbar shows the given message. */
  async expectSnackbar(message: string): Promise<void> {
    /* Looked up by text (not `role=alert`): the snackbar is a sibling of the
     * dialog and therefore `aria-hidden` while a modal is open, which keeps it
     * out of the accessibility tree even though it is visible. */
    await expect(this.page.getByText(message, { exact: true })).toBeVisible()
  }

  /** Signs the current user out through the sidebar action. */
  async signOut(): Promise<void> {
    await this.signOutButton.click()
  }
}
