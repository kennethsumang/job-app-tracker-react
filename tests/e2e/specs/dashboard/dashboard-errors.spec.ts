import { expect, test } from '../../fixtures'
import { TEST_ACCOUNTS } from '../../fixtures/users'

/**
 * Dashboard failure paths.
 *
 * Every request is retried once by `QueryProvider` (`retry: 1`), so a broken
 * endpoint is observed with `expect.poll` on the mock's request log instead of
 * a fixed sleep.
 */

const account = TEST_ACCOUNTS.verified

test.describe('Dashboard failure paths', () => {
  test.beforeEach(async ({ authApi }) => {
    authApi.authenticateAs(account.user)
  })

  test('keeps the dashboard usable when the counters cannot be loaded', async ({
    appApi,
    dashboardPage,
    loginPage,
  }) => {
    // Arrange
    appApi.failApplications({
      status: 500,
      message: 'Application service unavailable',
    })

    // Act
    await dashboardPage.goto()

    // Assert — both counters were requested (and retried) and failed
    await expect
      .poll(() => appApi.applicationListRequests.length)
      .toBeGreaterThanOrEqual(4)

    // Assert — the shell still renders and the tiles keep their placeholder
    await expect(dashboardPage.heading).toBeVisible()
    await dashboardPage.expectSummaryLoading()

    // Assert — the rest of the page stays usable
    await dashboardPage.signOut()
    await loginPage.expectLoaded()
  })

  test('hides the interview card when the interviews request fails', async ({
    appApi,
    dashboardPage,
  }) => {
    // Arrange
    appApi.failUpcomingInterviews('network-error')

    // Act
    await dashboardPage.goto()

    // Assert — the interview request was made (and retried) and failed
    await expect
      .poll(() => appApi.upcomingInterviewRequests.length)
      .toBeGreaterThanOrEqual(2)

    // Assert — no card, and the counters are unaffected
    await dashboardPage.expectNoUpcomingInterview()
    await dashboardPage.expectSummary(appApi.dashboardCounts)
  })

  test('hides the interview card when the interviewed application cannot be loaded', async ({
    appApi,
    dashboardPage,
  }) => {
    // Arrange
    appApi.failApplicationDetail({
      status: 500,
      message: 'Application service unavailable',
    })

    // Act
    await dashboardPage.goto()

    // Assert — the card needs both the interview and its application
    await dashboardPage.expectNoUpcomingInterview()

    // Assert — the counters are unaffected by the failing detail request
    await dashboardPage.expectSummary(appApi.dashboardCounts)
  })

  test('recovers the applications list after a failed request', async ({
    appApi,
    applicationsListPage,
    dashboardPage,
  }) => {
    // Arrange
    appApi.failApplications({
      status: 500,
      message: 'Application service unavailable',
    })
    await dashboardPage.goto()

    // Act
    await dashboardPage.clickApplicationsTile()

    // Assert — the list reports the failure and offers a retry
    await applicationsListPage.expectLoaded()
    await applicationsListPage.expectLoadError()

    // Act — the API recovers and the user retries
    appApi.clearFailures()
    await applicationsListPage.retry()

    // Assert — the list renders the applications
    await applicationsListPage.expectCompanies(
      appApi.applications.map((application) => application.companyName),
    )
  })
})
