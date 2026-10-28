import { expect, test } from '../../fixtures'
import { TEST_ACCOUNTS } from '../../fixtures/users'

/**
 * Application Detail page (`/app/applications/:id`) happy paths.
 *
 * Covers the header/info/interview rendering and the detail-page actions:
 * edit, status change, delete, and creating an interview.
 */

const account = TEST_ACCOUNTS.verified

test.describe('Application detail', () => {
  test.beforeEach(async ({ authApi }) => {
    authApi.authenticateAs(account.user)
  })

  test('loads the detail page with the header and empty interviews', async ({
    applicationDetailPage,
  }) => {
    // Act
    await applicationDetailPage.goto('app_e2e_1')

    // Assert — header card, status chip and empty interviews
    await applicationDetailPage.expectLoaded(
      'Acme Corp',
      'Senior Frontend Engineer',
    )
    await expect(applicationDetailPage.statusChip('Applied')).toBeVisible()
    await applicationDetailPage.expectNoInterviews()
  })

  test('edits the application from the detail page', async ({
    applicationDetailPage,
    applicationFormDialog,
  }) => {
    // Arrange
    await applicationDetailPage.goto('app_e2e_1')

    // Act
    await applicationDetailPage.openEdit()
    await applicationFormDialog.expectOpen()
    await applicationFormDialog.expectPrefilledBasics(
      'Acme Corp',
      'Senior Frontend Engineer',
    )
    await applicationFormDialog.fillCompany('Acme Corporation')
    await applicationFormDialog.next()
    await applicationFormDialog.save()

    // Assert
    await applicationFormDialog.expectClosed()
    await applicationDetailPage.expectSnackbar('Application updated.')
    await expect(
      applicationDetailPage.companyHeading('Acme Corporation'),
    ).toBeVisible()
  })

  test('changes the status of the application', async ({
    appApi,
    applicationDetailPage,
    statusChangeDialog,
  }) => {
    // Arrange
    await applicationDetailPage.goto('app_e2e_1')

    // Act
    await applicationDetailPage.openStatusChange()
    await statusChangeDialog.expectOpen()
    await statusChangeDialog.chooseStatus('Interview')
    await statusChangeDialog.save()

    // Assert
    await statusChangeDialog.expectClosed()
    await applicationDetailPage.expectSnackbar('Status updated.')
    expect(appApi.statusChangeRequests).toHaveLength(1)
    expect(appApi.statusChangeRequests[0]).toMatchObject({
      id: 'app_e2e_1',
      payload: { status: 'INTERVIEW' },
    })
    await expect(applicationDetailPage.statusChip('Interview')).toBeVisible()
  })

  test('deletes the application and returns to the list', async ({
    appApi,
    applicationDetailPage,
    applicationsListPage,
    deleteApplicationDialog,
  }) => {
    // Arrange
    await applicationDetailPage.goto('app_e2e_1')

    // Act
    await applicationDetailPage.openDelete()
    await deleteApplicationDialog.expectOpen('Acme Corp')
    await deleteApplicationDialog.confirm()

    // Assert — the user lands back on the list without the deleted record
    await applicationsListPage.expectLoaded()
    await applicationsListPage.expectCompanies(['Globex', 'Initech'])
    expect(appApi.deleteRequests).toHaveLength(1)
    expect(appApi.deleteRequests[0]).toEqual({ id: 'app_e2e_1' })
  })

  test('creates an interview on the application', async ({
    appApi,
    applicationDetailPage,
    interviewFormDialog,
  }) => {
    // Arrange
    await applicationDetailPage.goto('app_e2e_1')

    // Act
    await applicationDetailPage.openAddInterview()
    await interviewFormDialog.expectOpen()
    await interviewFormDialog.chooseType('Technical')
    await interviewFormDialog.fillScheduledAt('2026-10-30T10:00')
    await interviewFormDialog.chooseTimezone('UTC')
    await interviewFormDialog.fillLocation('Google Meet')
    await interviewFormDialog.fillNotes('Prepare questions')
    await interviewFormDialog.submit()

    // Assert — the dialog closes and the new interview is listed
    await interviewFormDialog.expectClosed()
    await applicationDetailPage.expectSnackbar('Interview added.')
    expect(appApi.createInterviewRequests).toHaveLength(1)
    expect(appApi.createInterviewRequests[0]).toMatchObject({
      applicationId: 'app_e2e_1',
      payload: {
        type: 'TECHNICAL',
        timezone: 'UTC',
        location: 'Google Meet',
        notes: 'Prepare questions',
      },
    })
    await expect(
      applicationDetailPage.editInterviewButton('Technical'),
    ).toBeVisible()
  })
})
