import { expect, test } from '../../fixtures'
import { TEST_ACCOUNTS } from '../../fixtures/users'
import { buildApplication, buildInterview } from '../../mocks/app-data-api.mock'

const account = TEST_ACCOUNTS.verified

/** ISO timestamp for the given day/hour of the current UTC month. */
function currentMonthIso(day: number, hour = 0): string {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  const dayLabel = String(day).padStart(2, '0')
  const hourLabel = String(hour).padStart(2, '0')
  return `${year}-${month}-${dayLabel}T${hourLabel}:00:00.000Z`
}

test.describe('Calendar', () => {
  test.beforeEach(async ({ authApi }) => {
    authApi.authenticateAs(account.user)
  })

  test('loads the calendar for an authenticated user', async ({
    calendarPage,
  }) => {
    await calendarPage.goto()

    await calendarPage.expectLoaded()
  })

  test('renders interview and applied events returned by the API', async ({
    appApi,
    calendarPage,
  }) => {
    // Arrange: one application and one interview inside the current month.
    appApi.setApplications([
      buildApplication({
        id: 'app_cal_1',
        companyName: 'Globex',
        positionTitle: 'Staff Engineer',
        status: 'INTERVIEW',
        appliedAt: currentMonthIso(10),
      }),
    ])
    appApi.setInterviews([
      buildInterview({
        id: 'int_cal_1',
        applicationId: 'app_cal_1',
        type: 'TECHNICAL',
        scheduledAt: currentMonthIso(15, 12),
        timezone: 'UTC',
      }),
    ])

    // Act
    await calendarPage.goto()

    // Assert
    await expect(calendarPage.event('Technical · Globex')).toBeVisible()
    await expect(calendarPage.event('Applied · Globex')).toBeVisible()
  })

  test('shows an interview from another timezone on the device-timezone day', async ({
    appApi,
    calendarPage,
  }) => {
    // Arrange: 16:00 UTC is 01:00 the following day in Tokyo (UTC+9).
    appApi.setApplications([
      buildApplication({
        id: 'app_cal_tz',
        companyName: 'Globex',
        positionTitle: 'Staff Engineer',
        status: 'INTERVIEW',
      }),
    ])
    appApi.setInterviews([
      buildInterview({
        id: 'int_cal_tz',
        applicationId: 'app_cal_tz',
        type: 'TECHNICAL',
        scheduledAt: currentMonthIso(15, 16),
        timezone: 'Asia/Tokyo',
      }),
    ])

    // Act
    await calendarPage.goto()

    // Assert: the device timezone is UTC, so the event lands on the 15th.
    await expect(calendarPage.eventOnDay(15, 'Technical · Globex')).toBeVisible()
    await expect(calendarPage.eventOnDay(16, 'Technical · Globex')).toHaveCount(0)
  })

  test('opens the day dialog and navigates to the application', async ({
    appApi,
    applicationDetailPage,
    calendarPage,
  }) => {
    // Arrange: a single applied event in the current month.
    appApi.setApplications([
      buildApplication({
        id: 'app_cal_1',
        companyName: 'Globex',
        positionTitle: 'Staff Engineer',
        status: 'INTERVIEW',
        appliedAt: currentMonthIso(10),
      }),
    ])
    appApi.setInterviews([])

    // Act: open the day dialog from the applied event, then follow its row.
    await calendarPage.goto()
    await calendarPage.event('Applied · Globex').click()

    // Assert
    await calendarPage.expectDayDialogWith('Globex — Staff Engineer')
    await calendarPage.clickDialogItem('Staff Engineer')

    await applicationDetailPage.expectLoaded('Globex', 'Staff Engineer')
  })
})
