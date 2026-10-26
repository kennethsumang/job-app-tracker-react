import { expect, test } from '../../fixtures'
import { TEST_ACCOUNTS } from '../../fixtures/users'

/**
 * Dashboard "Add Application" quick action.
 *
 * The widget opens a compact one-step dialog that creates an application with
 * the `DRAFT` status and refreshes the summary counters. These specs cover the
 * dialog itself (open/close, validation, in-flight state) and both the happy
 * and failing create paths.
 */

const account = TEST_ACCOUNTS.verified

test.describe('Dashboard · Add Application', () => {
  test.beforeEach(async ({ authApi, dashboardPage }) => {
    authApi.authenticateAs(account.user)
    await dashboardPage.goto()
  })

  test('opens the create dialog from the quick action', async ({
    addApplicationDialog,
    appApi,
    dashboardPage,
  }) => {
    // Arrange — dialog is closed until the tile is used
    await addApplicationDialog.expectClosed()

    // Act
    await dashboardPage.clickAddApplication()

    // Assert — title, required fields, optional selects and actions
    await addApplicationDialog.expectOpen()
    await expect(addApplicationDialog.dialog).toContainText('New Application')
    await expect(addApplicationDialog.employmentTypeSelect).toBeVisible()
    await expect(addApplicationDialog.workplaceTypeSelect).toBeVisible()
    await expect(addApplicationDialog.cancelButton).toBeEnabled()
    expect(appApi.createRequests).toHaveLength(0)
  })

  test('blocks the submission while the required fields are empty', async ({
    addApplicationDialog,
    appApi,
    dashboardPage,
  }) => {
    // Act — submit the untouched form
    await dashboardPage.clickAddApplication()
    await addApplicationDialog.submit()

    // Assert — both required messages, and nothing was sent
    await addApplicationDialog.expectRequiredErrors()
    expect(appApi.createRequests).toHaveLength(0)

    // Act — submit again with only the company filled in
    await addApplicationDialog.fillCompany('Hooli')
    await addApplicationDialog.submit()

    // Assert — the company error is gone, the position one remains
    await expect(addApplicationDialog.companyError).toHaveCount(0)
    await expect(addApplicationDialog.positionError).toBeVisible()
    expect(appApi.createRequests).toHaveLength(0)
  })

  test('creates the application and refreshes the dashboard counters', async ({
    addApplicationDialog,
    appApi,
    dashboardPage,
  }) => {
    // Arrange
    const before = appApi.dashboardCounts

    // Act — values are padded to prove they are trimmed before sending
    await dashboardPage.clickAddApplication()
    await addApplicationDialog.fillBasics('  Umbrella Corp  ', ' Backend Engineer ')
    await addApplicationDialog.chooseEmploymentType('Full time')
    await addApplicationDialog.chooseWorkplaceType('Hybrid')
    await addApplicationDialog.submit()

    // Assert — the dialog closes and the user gets feedback
    await addApplicationDialog.expectClosed()
    await dashboardPage.expectSnackbar('Application added successfully.')

    // Assert — the payload matches the contract (basics + DRAFT status)
    expect(appApi.createRequests).toHaveLength(1)
    expect(appApi.createRequests[0]).toMatchObject({
      companyName: 'Umbrella Corp',
      positionTitle: 'Backend Engineer',
      status: 'DRAFT',
      employmentType: 'FULL_TIME',
      workplaceType: 'HYBRID',
    })

    // Assert — the counters were invalidated and refetched: one more
    // application, while a DRAFT is not "in progress"
    await dashboardPage.expectSummary({
      total: before.total + 1,
      inProgress: before.inProgress,
    })
  })

  test('keeps the dialog open after a failed create and retries', async ({
    addApplicationDialog,
    appApi,
    dashboardPage,
  }) => {
    // Arrange
    const before = appApi.dashboardCounts
    appApi.failCreateApplication({
      status: 500,
      message: 'Application service unavailable',
    })

    // Act
    await dashboardPage.clickAddApplication()
    await addApplicationDialog.fillBasics('Hooli', 'QA Engineer')
    await addApplicationDialog.submit()

    // Assert — error feedback, dialog stays open with the entered values
    await dashboardPage.expectSnackbar('Failed to add application.')
    await addApplicationDialog.expectOpen()
    await expect(addApplicationDialog.companyInput).toHaveValue('Hooli')
    await expect(addApplicationDialog.positionInput).toHaveValue('QA Engineer')

    // Assert — nothing was created
    expect(appApi.applications).toHaveLength(before.total)

    // Act — the API recovers and the user retries
    appApi.clearFailures()
    await addApplicationDialog.submit()

    // Assert — the second attempt succeeds and the counters catch up
    await addApplicationDialog.expectClosed()
    await dashboardPage.expectSnackbar('Application added successfully.')
    expect(appApi.createRequests).toHaveLength(2)
    await dashboardPage.expectSummary({
      total: before.total + 1,
      inProgress: before.inProgress,
    })
  })

  test('discards the entered values when the dialog is cancelled', async ({
    addApplicationDialog,
    appApi,
    dashboardPage,
  }) => {
    // Act — fill the form, then dismiss it
    await dashboardPage.clickAddApplication()
    await addApplicationDialog.fillBasics('Acme Corp', 'Senior Frontend Engineer')
    await addApplicationDialog.cancel()

    // Assert — closed without creating anything
    await addApplicationDialog.expectClosed()
    expect(appApi.createRequests).toHaveLength(0)

    // Act — open it again
    await dashboardPage.clickAddApplication()

    // Assert — the dialog is remounted, so it starts from a clean form
    await addApplicationDialog.expectOpen()
    await expect(addApplicationDialog.companyInput).toHaveValue('')
    await expect(addApplicationDialog.positionInput).toHaveValue('')
  })

  test('locks the actions while the application is being saved', async ({
    addApplicationDialog,
    appApi,
    dashboardPage,
  }) => {
    // Arrange — slow create so the in-flight state is observable
    appApi.setLatency(800)
    await dashboardPage.clickAddApplication()
    await addApplicationDialog.fillBasics('Initech', 'Site Reliability Engineer')

    // Act
    await addApplicationDialog.submit()

    // Assert — Cancel and Create are both disabled while saving
    await addApplicationDialog.expectSaving()
    await addApplicationDialog.expectClosed()
    expect(appApi.createRequests).toHaveLength(1)
  })
})
