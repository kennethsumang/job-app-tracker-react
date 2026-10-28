import { expect, test } from '../../fixtures'
import { TEST_ACCOUNTS } from '../../fixtures/users'

/**
 * Edit Application via the list entry's edit action.
 *
 * Each card opens the two-step `ApplicationFormDialog` pre-filled with the
 * application. These specs cover the pre-fill, a successful edit, the
 * client-side required validation and the failing update path with retry.
 */

const account = TEST_ACCOUNTS.verified

test.describe('Applications list · Edit Application', () => {
  test.beforeEach(async ({ authApi }) => {
    authApi.authenticateAs(account.user)
  })

  test('opens the edit dialog pre-filled with the application', async ({
    applicationFormDialog,
    applicationsListPage,
  }) => {
    // Arrange
    await applicationsListPage.goto()

    // Act
    await applicationsListPage.editButton('Acme Corp').click()

    // Assert — title and the basics of the edited application
    await applicationFormDialog.expectOpen()
    await applicationFormDialog.expectPrefilledBasics(
      'Acme Corp',
      'Senior Frontend Engineer',
    )
    await expect(applicationFormDialog.employmentTypeSelect).toBeVisible()
    await expect(applicationFormDialog.workplaceTypeSelect).toBeVisible()
  })

  test('edits the application and updates the list', async ({
    appApi,
    applicationFormDialog,
    applicationsListPage,
  }) => {
    // Arrange
    await applicationsListPage.goto()

    // Act — change the basics, then add some optional details
    await applicationsListPage.editButton('Acme Corp').click()
    await applicationFormDialog.fillCompany('Acme Corporation')
    await applicationFormDialog.next()
    await applicationFormDialog.fillDetails({
      website: 'https://acme.example.com',
      notes: 'Follow up soon',
    })
    await applicationFormDialog.save()

    // Assert — the dialog closes and the user gets feedback
    await applicationFormDialog.expectClosed()
    await applicationsListPage.expectSnackbar('Application updated.')

    // Assert — the update payload matches the contract
    expect(appApi.updateRequests).toHaveLength(1)
    expect(appApi.updateRequests[0]).toMatchObject({
      id: 'app_e2e_1',
      payload: {
        companyName: 'Acme Corporation',
        positionTitle: 'Senior Frontend Engineer',
        status: 'APPLIED',
        companyWebsite: 'https://acme.example.com',
        notes: 'Follow up soon',
      },
    })

    // Assert — the list was invalidated and refetched with the edit
    await applicationsListPage.expectCompanies([
      'Acme Corporation',
      'Globex',
      'Initech',
    ])
  })

  test('blocks saving when a required field is cleared', async ({
    appApi,
    applicationFormDialog,
    applicationsListPage,
  }) => {
    // Arrange
    await applicationsListPage.goto()

    // Act — clear the company and try to advance to the details step
    await applicationsListPage.editButton('Acme Corp').click()
    await applicationFormDialog.fillCompany('')
    await applicationFormDialog.next()

    // Assert — the error is shown and nothing was sent
    await expect(applicationFormDialog.dialog).toContainText(
      'Company name is required.',
    )
    expect(appApi.updateRequests).toHaveLength(0)
  })

  test('keeps the dialog open after a failed update and retries', async ({
    appApi,
    applicationFormDialog,
    applicationsListPage,
  }) => {
    // Arrange
    await applicationsListPage.goto()
    appApi.failUpdateApplication({
      status: 500,
      message: 'Application service unavailable',
    })

    // Act — edit and submit while the API is broken
    await applicationsListPage.editButton('Acme Corp').click()
    await applicationFormDialog.fillCompany('Acme Corporation')
    await applicationFormDialog.next()
    await applicationFormDialog.fillDetails({
      website: 'https://acme.example.com',
    })
    await applicationFormDialog.save()

    // Assert — error feedback and the entered values stay put
    await applicationsListPage.expectSnackbar('Failed to update application.')
    await applicationFormDialog.expectOpen()
    await expect(applicationFormDialog.websiteInput).toHaveValue(
      'https://acme.example.com',
    )

    // Act — the API recovers and the user retries the same save
    appApi.clearFailures()
    await applicationFormDialog.save()

    // Assert — the second attempt succeeds and the list catches up
    await applicationFormDialog.expectClosed()
    await applicationsListPage.expectSnackbar('Application updated.')
    expect(appApi.updateRequests).toHaveLength(2)
    await applicationsListPage.expectCompanies([
      'Acme Corporation',
      'Globex',
      'Initech',
    ])
  })
})
