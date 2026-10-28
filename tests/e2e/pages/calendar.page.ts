import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Page object for the authenticated calendar (`/app/calendar`).
 *
 * Models the page heading, the FullCalendar month grid and the day-detail
 * dialog that opens when a day or event is clicked.
 */
export class CalendarPage {
  readonly page: Page
  readonly heading: Locator
  readonly calendarGrid: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { level: 1, name: 'Calendar' })
    this.calendarGrid = page.locator('.fc-daygrid')
  }

  /** Navigates straight to the calendar (bypassing the login form). */
  async goto(): Promise<void> {
    await this.page.goto('/app/calendar')
    await this.expectLoaded()
  }

  /** Asserts the calendar page is fully rendered for an authenticated user. */
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/app\/calendar$/)
    await expect(this.heading).toBeVisible()
    await expect(this.calendarGrid).toBeVisible()
  }

  /** A FullCalendar event labelled with the given title. */
  event(title: string): Locator {
    return this.page.getByText(title, { exact: true })
  }

  /** A FullCalendar event inside the given day cell of the current UTC month. */
  eventOnDay(day: number, title: string): Locator {
    const now = new Date()
    const year = now.getUTCFullYear()
    const month = String(now.getUTCMonth() + 1).padStart(2, '0')
    const dayLabel = String(day).padStart(2, '0')
    return this.page
      .locator(`.fc-daygrid-day[data-date="${year}-${month}-${dayLabel}"]`)
      .getByText(title, { exact: true })
  }

  /** Asserts the day-detail dialog is open and lists the given event row. */
  async expectDayDialogWith(rowText: string): Promise<void> {
    const dialog = this.page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText(rowText, { exact: true })).toBeVisible()
  }

  /** Clicks an event row inside the open day-detail dialog. */
  async clickDialogItem(rowText: string): Promise<void> {
    await this.page
      .getByRole('dialog')
      .getByRole('button', { name: new RegExp(rowText) })
      .click()
  }
}
