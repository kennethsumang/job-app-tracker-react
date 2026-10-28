import { expect, test } from '../../fixtures'
import { TEST_ACCOUNTS } from '../../fixtures/users'

/**
 * Applications list (`/app/applications`) failure paths.
 *
 * Every request is retried once by `QueryProvider` (`retry: 1`), so a broken
 * endpoint is observed with `expect.poll` on the mock's request log instead of
 * a fixed sleep.
 */

const account = TEST_ACCOUNTS.verified

test.describe('Applications list failure paths', () => {
  test.beforeEach(async ({ authApi }) => {
    authApi.authenticateAs(account.user)
  })

  test('shows the failure state and recovers with a retry', async ({
    appApi,
    applicationsListPage,
  }) => {
    // Arrange
    appApi.failApplications({
      status: 500,
      message: 'Application service unavailable',
    })

    // Act
    await applicationsListPage.goto()

    // Assert — the request was made (and retried) and failed
    await expect
      .poll(() => appApi.applicationListRequests.length)
      .toBeGreaterThanOrEqual(2)
    await applicationsListPage.expectLoadError()

    // Act — the API recovers and the user retries
    appApi.clearFailures()
    await applicationsListPage.retry()

    // Assert — the list renders the applications
    await applicationsListPage.expectCompanies(
      appApi.applications.map((application) => application.companyName),
    )
  })

  test('keeps the applied filters when a filtered request fails', async ({
    appApi,
    applicationsListPage,
  }) => {
    // Arrange — the list loads fine first, then the API breaks
    await applicationsListPage.goto()
    appApi.failApplications({
      status: 500,
      message: 'Application service unavailable',
    })

    // Act — changing the filter triggers a new (failing) request
    await applicationsListPage.openFilters()
    await applicationsListPage.toggleStatus('Rejected')
    await applicationsListPage.applyFilters()

    // Assert — the filtered request failed with the filter attached
    await applicationsListPage.expectLoadError()
    expect(appApi.applicationListRequests.at(-1)).toMatchObject({
      statuses: ['REJECTED'],
    })

    // Act — the API recovers and the user retries the same filtered view
    appApi.clearFailures()
    await applicationsListPage.retry()

    // Assert — the filter is still applied and the result is filtered
    await applicationsListPage.expectCompanies(['Initech'])
    expect(appApi.applicationListRequests.at(-1)).toMatchObject({
      statuses: ['REJECTED'],
    })
  })

  test('surfaces a network failure with a human-readable message', async ({
    appApi,
    applicationsListPage,
  }) => {
    // Arrange
    appApi.failApplications('network-error')

    // Act
    await applicationsListPage.goto()

    // Assert — the error state explains the connectivity problem
    await applicationsListPage.expectLoadError()
    await expect(applicationsListPage.errorMessage).toContainText(
      'Unable to reach the API',
    )
  })
})
