import { expect, test } from '../../fixtures'
import { TEST_ACCOUNTS } from '../../fixtures/users'

/**
 * Application Detail page (`/app/applications/:id`) failure paths.
 *
 * Each action is exercised against a broken endpoint and then retried once the
 * API recovers.
 */

const account = TEST_ACCOUNTS.verified

test.describe('Application detail failure paths', () => {
  test.beforeEach(async ({ authApi }) => {
    authApi.authenticateAs(account.user)
  })

  test('keeps the edit dialog open after a failed update and retries', async ({
    appApi,
    applicationDetailPage,
    applicationFormDialog,
  }) => {
    // Arrange
    await applicationDetailPage.goto('app_e2e_1')
    appApi.failUpdateApplication({
      status: 500,
      message: 'Application service unavailable',
    })

    // Act
    await applicationDetailPage.openEdit()
    await applicationFormDialog.fillCompany('Acme Corporation')
    await applicationFormDialog.next()
    await applicationFormDialog.save()

    // Assert — error feedback, dialog stays open
    await applicationDetailPage.expectSnackbar('Failed to update application.')
    await applicationFormDialog.expectOpen()

    // Act — the API recovers and the user retries
    appApi.clearFailures()
    await applicationFormDialog.save()

    // Assert
    await applicationFormDialog.expectClosed()
    await applicationDetailPage.expectSnackbar('Application updated.')
    await expect(
      applicationDetailPage.companyHeading('Acme Corporation'),
    ).toBeVisible()
  })

  test('keeps the status dialog open after a failed status change and retries', async ({
    appApi,
    applicationDetailPage,
    statusChangeDialog,
  }) => {
    // Arrange
    await applicationDetailPage.goto('app_e2e_1')
    appApi.failStatusChange({
      status: 500,
      message: 'Application service unavailable',
    })

    // Act
    await applicationDetailPage.openStatusChange()
    await statusChangeDialog.chooseStatus('Interview')
    await statusChangeDialog.save()

    // Assert — error feedback, dialog stays open
    await applicationDetailPage.expectSnackbar('Failed to update the status.')
    await statusChangeDialog.expectOpen()

    // Act — the API recovers and the user retries
    appApi.clearFailures()
    await statusChangeDialog.save()

    // Assert
    await statusChangeDialog.expectClosed()
    await applicationDetailPage.expectSnackbar('Status updated.')
    await expect(applicationDetailPage.statusChip('Interview')).toBeVisible()
  })

  test('keeps the application when the delete fails and retries', async ({
    appApi,
    applicationDetailPage,
    applicationsListPage,
    deleteApplicationDialog,
  }) => {
    // Arrange
    await applicationDetailPage.goto('app_e2e_1')
    appApi.failDeleteApplication({
      status: 500,
      message: 'Application service unavailable',
    })

    // Act
    await applicationDetailPage.openDelete()
    await deleteApplicationDialog.expectOpen('Acme Corp')
    await deleteApplicationDialog.confirm()

    // Assert — error feedback, still on the detail page
    await applicationDetailPage.expectSnackbar('Failed to delete application.')
    await deleteApplicationDialog.expectClosed()
    await applicationDetailPage.expectLoaded(
      'Acme Corp',
      'Senior Frontend Engineer',
    )

    // Act — the API recovers and the user deletes again
    appApi.clearFailures()
    await applicationDetailPage.openDelete()
    await deleteApplicationDialog.expectOpen('Acme Corp')
    await deleteApplicationDialog.confirm()

    // Assert
    await applicationsListPage.expectLoaded()
    await applicationsListPage.expectCompanies(['Globex', 'Initech'])
    expect(appApi.deleteRequests).toHaveLength(2)
  })

  test('keeps the interview dialog open after a failed create and retries', async ({
    appApi,
    applicationDetailPage,
    interviewFormDialog,
  }) => {
    // Arrange
    await applicationDetailPage.goto('app_e2e_1')
    appApi.failCreateInterview({
      status: 500,
      message: 'Application service unavailable',
    })

    // Act
    await applicationDetailPage.openAddInterview()
    await interviewFormDialog.chooseType('Technical')
    await interviewFormDialog.fillScheduledAt('2026-10-30T10:00')
    await interviewFormDialog.submit()

    // Assert — error feedback, dialog stays open
    await applicationDetailPage.expectSnackbar('Failed to add the interview.')
    await interviewFormDialog.expectOpen()

    // Act — the API recovers and the user retries
    appApi.clearFailures()
    await interviewFormDialog.submit()

    // Assert
    await interviewFormDialog.expectClosed()
    await applicationDetailPage.expectSnackbar('Interview added.')
    await expect(
      applicationDetailPage.editInterviewButton('Technical'),
    ).toBeVisible()
  })
})
