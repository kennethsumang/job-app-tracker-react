import { expect, type Locator, type Page } from '@playwright/test'

/** Dashboard counters rendered by the summary tiles. */
export interface DashboardSummary {
  total: number
  inProgress: number
}

/**
 * Page object for the authenticated dashboard (`/app`).
 *
 * Only the elements the auth journey asserts on are modelled: the greeting
 * heading, the two summary tiles and the sign-out action.
 */
export class DashboardPage {
  readonly page: Page
  readonly heading: Locator
  readonly subtitle: Locator
  readonly signOutButton: Locator
  readonly summarySection: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { level: 1, name: 'Welcome back!' })
    this.subtitle = page.getByText('Track and manage your job applications.', {
      exact: true,
    })
    this.signOutButton = page.getByRole('button', { name: 'Sign Out', exact: true })
    this.summarySection = page.getByRole('region', { name: 'Application summary' })
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
    await expect(
      this.page.getByRole('button', { name: `Applications: ${total}` }),
    ).toBeVisible()
    await expect(
      this.page.getByRole('button', { name: `In Progress: ${inProgress}` }),
    ).toBeVisible()
  }

  /** Signs the current user out through the sidebar action. */
  async signOut(): Promise<void> {
    await this.signOutButton.click()
  }
}
