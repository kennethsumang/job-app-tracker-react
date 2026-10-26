import { expect, test } from '../../fixtures'
import { TEST_ACCOUNTS } from '../../fixtures/users'
import {
  IN_PROGRESS_STATUSES,
  buildApplication,
} from '../../mocks/app-data-api.mock'

/**
 * Dashboard (`/app`) coverage.
 *
 * The dashboard is the landing page after sign-in, so these specs assert what a
 * returning user sees: the greeting, the counters the API returned, the next
 * interview and where each widget sends them.
 *
 * The "Add Application" quick action is deliberately not covered here — that
 * feature is being reworked.
 */

const account = TEST_ACCOUNTS.verified
const inProgressStatuses = new Set<string>(IN_PROGRESS_STATUSES)

test.describe('Dashboard', () => {
  test.beforeEach(async ({ authApi }) => {
    authApi.authenticateAs(account.user)
  })

  test('loads the dashboard for an authenticated user', async ({
    dashboardPage,
  }) => {
    // Arrange — authenticated session provided by `beforeEach`.

    // Act
    await dashboardPage.goto()

    // Assert — greeting, summary widgets and the shell chrome are all present
    await expect(dashboardPage.heading).toBeVisible()
    await expect(dashboardPage.subtitle).toBeVisible()
    await expect(dashboardPage.summarySection).toBeVisible()
    await expect(dashboardPage.applicationsTile).toBeVisible()
    await expect(dashboardPage.inProgressTile).toBeVisible()
    await expect(dashboardPage.quickActionsSection).toBeVisible()
    await expect(dashboardPage.signOutButton).toBeVisible()
  })

  test('shows loading placeholders first and fills the widgets afterwards', async ({
    appApi,
    dashboardPage,
  }) => {
    // Arrange — slow API so the intermediate state is observable
    appApi.setLatency(600)

    // Act
    await dashboardPage.goto()

    // Assert — the shell renders before the counters arrive
    await dashboardPage.expectSummaryLoading()
    await expect(dashboardPage.upcomingInterviewCard).toHaveCount(0)

    // Assert — and the widgets fill in once the API responds
    await dashboardPage.expectSummary(appApi.dashboardCounts)
    await expect(dashboardPage.upcomingInterviewCard).toBeVisible()
  })

  test('shows the counters returned by the API', async ({
    appApi,
    dashboardPage,
  }) => {
    // Arrange — 3 applications, 2 of them in progress
    const counts = appApi.dashboardCounts

    // Act
    await dashboardPage.goto()

    // Assert — the tiles show exactly what the mock served
    await dashboardPage.expectSummary(counts)
    expect(counts).toEqual({ total: 3, inProgress: 2 })

    // Assert — the counters came from counting endpoints, not hardcoded data
    expect(appApi.applicationListRequests).toContainEqual(
      expect.objectContaining({ limit: 1, statuses: [] }),
    )
    expect(appApi.applicationListRequests).toContainEqual(
      expect.objectContaining({
        limit: 1,
        statuses: [...IN_PROGRESS_STATUSES],
      }),
    )
  })

  test('recomputes the counters when the API returns another dataset', async ({
    appApi,
    dashboardPage,
  }) => {
    // Arrange — 5 applications, only APPLIED and OFFER count as in progress
    appApi.setApplications([
      buildApplication({ id: 'app_multi_1', status: 'APPLIED' }),
      buildApplication({ id: 'app_multi_2', status: 'ACCEPTED' }),
      buildApplication({ id: 'app_multi_3', status: 'WITHDRAWN' }),
      buildApplication({ id: 'app_multi_4', status: 'REJECTED' }),
      buildApplication({ id: 'app_multi_5', status: 'OFFER' }),
    ])
    appApi.setUpcomingInterviews([])
    const counts = appApi.dashboardCounts

    // Act
    await dashboardPage.goto()

    // Assert
    await dashboardPage.expectSummary(counts)
    expect(counts).toEqual({ total: 5, inProgress: 2 })
  })

  test('renders the next interview returned by the API', async ({
    appApi,
    dashboardPage,
  }) => {
    // Act
    await dashboardPage.goto()

    // Assert — the card describes the interview and its application
    await dashboardPage.expectUpcomingInterview({
      type: 'Technical',
      company: 'Globex',
      position: 'Staff Engineer',
    })
    expect(appApi.upcomingInterviewRequests).toContainEqual(
      expect.objectContaining({ top: 1 }),
    )
  })

  test('hides the interview card when the API has no upcoming interview', async ({
    appApi,
    dashboardPage,
  }) => {
    // Arrange
    appApi.setUpcomingInterviews([])

    // Act
    await dashboardPage.goto()

    // Assert — no card, but the rest of the dashboard still works
    await dashboardPage.expectNoUpcomingInterview()
    await dashboardPage.expectSummary(appApi.dashboardCounts)
  })

  test('opens the applications list from the Applications widget', async ({
    appApi,
    applicationsListPage,
    dashboardPage,
  }) => {
    // Arrange
    await dashboardPage.goto()

    // Act
    await dashboardPage.clickApplicationsTile()

    // Assert — every application is listed, regardless of status
    await applicationsListPage.expectLoaded()
    await applicationsListPage.expectCompanies(
      appApi.applications.map((application) => application.companyName),
    )
  })

  test('opens the filtered applications list from the In Progress widget', async ({
    appApi,
    applicationsListPage,
    dashboardPage,
  }) => {
    // Arrange
    const expectedCompanies = appApi.applications
      .filter((application) => inProgressStatuses.has(application.status))
      .map((application) => application.companyName)
    await dashboardPage.goto()

    // Act
    await dashboardPage.clickInProgressTile()

    // Assert — the dashboard's status filter is applied to the list
    await applicationsListPage.expectLoaded()
    await applicationsListPage.expectCompanies(expectedCompanies)
    await expect(applicationsListPage.card('Initech')).toHaveCount(0)
  })

  test('opens the application detail page from the interview widget', async ({
    dashboardPage,
    applicationDetailPage,
  }) => {
    // Arrange
    await dashboardPage.goto()

    // Act
    await dashboardPage.clickUpcomingInterview()

    // Assert — the detail page of the interviewed application
    await expect(dashboardPage.page).toHaveURL('/app/applications/app_e2e_2')
    await applicationDetailPage.expectLoaded('Globex', 'Staff Engineer')
  })

  test('applies the In Progress filter after visiting the full list first', async ({
    appApi,
    applicationsListPage,
    dashboardPage,
  }) => {
    // Arrange
    const expectedCompanies = appApi.applications
      .filter((application) => inProgressStatuses.has(application.status))
      .map((application) => application.companyName)
    await dashboardPage.goto()

    // Act — Applications widget, back to the dashboard, In Progress widget
    await dashboardPage.clickApplicationsTile()
    await applicationsListPage.expectLoaded()
    await applicationsListPage.goBackToDashboard()
    await dashboardPage.expectLoaded()
    await dashboardPage.clickInProgressTile()

    // Assert — the second widget still applies its own status filter
    await applicationsListPage.expectLoaded()
    await applicationsListPage.expectCompanies(expectedCompanies)
    await expect(applicationsListPage.card('Initech')).toHaveCount(0)
  })

  test('clears the In Progress filter when the full list is opened afterwards', async ({
    appApi,
    applicationsListPage,
    dashboardPage,
  }) => {
    // Arrange
    const allCompanies = appApi.applications.map(
      (application) => application.companyName,
    )
    await dashboardPage.goto()

    // Act — In Progress widget, back to the dashboard, Applications widget
    await dashboardPage.clickInProgressTile()
    await applicationsListPage.expectLoaded()
    await expect(applicationsListPage.card('Initech')).toHaveCount(0)
    await applicationsListPage.goBackToDashboard()
    await dashboardPage.expectLoaded()
    await dashboardPage.clickApplicationsTile()

    // Assert — no status filter is left over from the previous visit
    await applicationsListPage.expectLoaded()
    await applicationsListPage.expectCompanies(allCompanies)
    expect(appApi.applicationListRequests.at(-1)).toMatchObject({
      statuses: [],
    })
  })

  test('signs the user out from the dashboard', async ({
    authApi,
    dashboardPage,
    loginPage,
  }) => {
    // Arrange
    await dashboardPage.goto()

    // Act
    await dashboardPage.signOut()

    // Assert — back on the login screen with the session cleared
    await loginPage.expectLoaded()
    await expect(dashboardPage.page).toHaveURL('/')
    expect(authApi.signOutCalls).toBe(1)
  })
})
