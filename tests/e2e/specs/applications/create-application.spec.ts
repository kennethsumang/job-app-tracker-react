import { expect, test } from '../../fixtures'
import { TEST_ACCOUNTS } from '../../fixtures/users'

/**
 * Create Application via the applications-list floating action button.
 *
 * The FAB opens the same compact `CreateApplicationFormDialog` as the
 * dashboard quick action, but the list page reports success/failure with the
 * `messages.created` / `messages.createFailed` copy. These specs cover the
 * dialog lifecycle, validation, and both the happy and failing create paths.
 */

const account = TEST_ACCOUNTS.verified

test.describe('Applications list · Create Application', () => {
  test.beforeEach(async ({ authApi }) => {
    authApi.authenticateAs(account.user)
  })

  test('opens the create dialog from the floating action button', async ({
    addApplicationDialog,
    appApi,
    applicationsListPage,
  }) => {
    // Arrange
    await applicationsListPage.goto()
    await addApplicationDialog.expectClosed()

    // Act
    await applicationsListPage.openAddApplication()

    // Assert — title, required fields, optional selects and actions
    await addApplicationDialog.expectOpen()
    await expect(addApplicationDialog.dialog).toContainText('New Application')
    await expect(addApplicationDialog.employmentTypeSelect).toBeVisible()
    await expect(addApplicationDialog.workplaceTypeSelect).toBeVisible()
    await expect(addApplicationDialog.cancelButton).toBeEnabled()
    expect(appApi.createRequests).toHaveLength(0)
  })

  test('creates an application and lists it', async ({
    addApplicationDialog,
    appApi,
    applicationsListPage,
  }) => {
    // Arrange
    const before = appApi.applications.map((application) => application.companyName)
    await applicationsListPage.goto()

    // Act — values are padded to prove they are trimmed before sending
    await applicationsListPage.openAddApplication()
    await addApplicationDialog.fillBasics('  Initech  ', ' Backend Engineer ')
    await addApplicationDialog.chooseEmploymentType('Full time')
    await addApplicationDialog.chooseWorkplaceType('Hybrid')
    await addApplicationDialog.submit()

    // Assert — the dialog closes and the user gets feedback
    await addApplicationDialog.expectClosed()
    await applicationsListPage.expectSnackbar('Application created.')

    // Assert — the payload matches the contract (basics + DRAFT status)
    expect(appApi.createRequests).toHaveLength(1)
    expect(appApi.createRequests[0]).toMatchObject({
      companyName: 'Initech',
      positionTitle: 'Backend Engineer',
      status: 'DRAFT',
      employmentType: 'FULL_TIME',
      workplaceType: 'HYBRID',
    })

    // Assert — the list was invalidated and refetched with the new record
    await applicationsListPage.expectCompanies([...before, 'Initech'])
  })

  test('blocks creation while the required fields are empty', async ({
    addApplicationDialog,
    appApi,
    applicationsListPage,
  }) => {
    // Arrange
    await applicationsListPage.goto()

    // Act — submit the untouched form
    await applicationsListPage.openAddApplication()
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

  test('keeps the dialog open after a failed create and retries', async ({
    addApplicationDialog,
    appApi,
    applicationsListPage,
  }) => {
    // Arrange
    const before = appApi.applications.map((application) => application.companyName)
    appApi.failCreateApplication({
      status: 500,
      message: 'Application service unavailable',
    })
    await applicationsListPage.goto()

    // Act
    await applicationsListPage.openAddApplication()
    await addApplicationDialog.fillBasics('Umbrella Corp', 'QA Engineer')
    await addApplicationDialog.submit()

    // Assert — error feedback, dialog stays open with the entered values
    await applicationsListPage.expectSnackbar('Failed to create application.')
    await addApplicationDialog.expectOpen()
    await expect(addApplicationDialog.companyInput).toHaveValue('Umbrella Corp')
    await expect(addApplicationDialog.positionInput).toHaveValue('QA Engineer')
    expect(appApi.applications).toHaveLength(before.length)

    // Act — the API recovers and the user retries
    appApi.clearFailures()
    await addApplicationDialog.submit()

    // Assert — the second attempt succeeds and the list catches up
    await addApplicationDialog.expectClosed()
    await applicationsListPage.expectSnackbar('Application created.')
    expect(appApi.createRequests).toHaveLength(2)
    await applicationsListPage.expectCompanies([...before, 'Umbrella Corp'])
  })
})
