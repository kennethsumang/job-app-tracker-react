import { expect, test } from '../../fixtures'
import { TEST_ACCOUNTS } from '../../fixtures/users'

/**
 * Delete Application via the list entry's delete action.
 *
 * The card opens a soft-delete confirmation dialog. These specs cover the
 * confirmation happy path, cancelling, and the failing delete path with a
 * retry after the API recovers.
 */

const account = TEST_ACCOUNTS.verified

test.describe('Applications list · Delete Application', () => {
  test.beforeEach(async ({ authApi }) => {
    authApi.authenticateAs(account.user)
  })

  test('deletes an application after confirmation', async ({
    appApi,
    applicationsListPage,
    deleteApplicationDialog,
  }) => {
    // Arrange
    await applicationsListPage.goto()

    // Act
    await applicationsListPage.deleteButton('Acme Corp').click()
    await deleteApplicationDialog.expectOpen('Acme Corp')
    await deleteApplicationDialog.confirm()

    // Assert — the dialog closes and the user gets feedback
    await deleteApplicationDialog.expectClosed()
    await applicationsListPage.expectSnackbar('Application deleted.')

    // Assert — the delete hit the right application
    expect(appApi.deleteRequests).toHaveLength(1)
    expect(appApi.deleteRequests[0]).toEqual({ id: 'app_e2e_1' })

    // Assert — the list was invalidated and refetched without the record
    await applicationsListPage.expectCompanies(['Globex', 'Initech'])
  })

  test('cancels the deletion and keeps the application', async ({
    appApi,
    applicationsListPage,
    deleteApplicationDialog,
  }) => {
    // Arrange
    await applicationsListPage.goto()

    // Act
    await applicationsListPage.deleteButton('Globex').click()
    await deleteApplicationDialog.expectOpen('Globex')
    await deleteApplicationDialog.cancel()

    // Assert — closed without sending a delete request
    await deleteApplicationDialog.expectClosed()
    expect(appApi.deleteRequests).toHaveLength(0)
    await applicationsListPage.expectCompanies([
      'Acme Corp',
      'Globex',
      'Initech',
    ])
  })

  test('keeps the application when the delete fails and retries', async ({
    appApi,
    applicationsListPage,
    deleteApplicationDialog,
  }) => {
    // Arrange
    await applicationsListPage.goto()
    appApi.failDeleteApplication({
      status: 500,
      message: 'Application service unavailable',
    })

    // Act
    await applicationsListPage.deleteButton('Acme Corp').click()
    await deleteApplicationDialog.expectOpen('Acme Corp')
    await deleteApplicationDialog.confirm()

    // Assert — error feedback, the record is untouched and the list is intact
    await applicationsListPage.expectSnackbar('Failed to delete application.')
    await deleteApplicationDialog.expectClosed()
    await applicationsListPage.expectCompanies([
      'Acme Corp',
      'Globex',
      'Initech',
    ])

    // Act — the API recovers and the user deletes again
    appApi.clearFailures()
    await applicationsListPage.deleteButton('Acme Corp').click()
    await deleteApplicationDialog.expectOpen('Acme Corp')
    await deleteApplicationDialog.confirm()

    // Assert — the second attempt succeeds
    await applicationsListPage.expectSnackbar('Application deleted.')
    await applicationsListPage.expectCompanies(['Globex', 'Initech'])
    expect(appApi.deleteRequests).toHaveLength(2)
  })
})
