import { expect, test } from '../../fixtures'
import { TEST_ACCOUNTS } from '../../fixtures/users'
import {
  DEFAULT_NOTES,
  buildNote,
} from '../../mocks/app-data-api.mock'
import type { ApplicationDetailPage } from '../../pages/application-detail.page'

const account = TEST_ACCOUNTS.verified

/** Seeded notes ordered newest first (the default sort). */
const NEWEST_FIRST = [
  'Prepare two system design examples.',
  'Recruiter asked for salary expectations.',
  'Initial screening scheduled for next week.',
] as const

/** The same notes ordered oldest first. */
const OLDEST_FIRST = [...NEWEST_FIRST].reverse()

/** Navigates straight to the Globex application and waits for the notes. */
async function openNotes(detail: ApplicationDetailPage): Promise<void> {
  await detail.page.goto('/app/applications/app_e2e_2')
  await detail.expectLoaded('Globex', 'Staff Engineer')
  await expect(detail.notesHeading).toBeVisible()
}

test.describe('Application notes', () => {
  test.beforeEach(async ({ authApi }) => {
    authApi.authenticateAs(account.user)
  })

  test('lists notes newest first and shows created dates in the device timezone', async ({
    applicationDetailPage: detail,
  }) => {
    // Act
    await openNotes(detail)

    // Assert — every seeded note is visible, newest first by default
    await detail.expectNotesVisible(NEWEST_FIRST)
    await detail.expectNoteOrder(NEWEST_FIRST)
    await expect(detail.sortNewestButton).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    // Assert — the newest note renders its creation date in the device zone
    const newestCard = detail.noteCard(DEFAULT_NOTES[2].content)
    await expect(newestCard).toContainText('Oct 1, 2025')
    await expect(newestCard).toContainText('(UTC)')
  })

  test('sorts notes oldest first when the toggle is switched', async ({
    applicationDetailPage: detail,
  }) => {
    // Arrange
    await openNotes(detail)

    // Act
    await detail.sortOldestButton.click()

    // Assert
    await expect(detail.sortOldestButton).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await detail.expectNoteOrder(OLDEST_FIRST)
  })

  test('adds a note and shows it at the top of the list', async ({
    appApi,
    applicationDetailPage: detail,
  }) => {
    // Arrange
    await openNotes(detail)

    // Act
    await detail.notesAddButton.click()
    const dialog = detail.page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('textbox').fill('Send a thank-you email.')
    await dialog.getByRole('button', { name: 'Add note' }).click()

    // Assert — the dialog closes and the new note is first (newest)
    await expect(dialog).toBeHidden()
    await detail.expectNotesVisible(['Send a thank-you email.'])
    await detail.expectNoteOrder(['Send a thank-you email.', ...NEWEST_FIRST])
    expect(appApi.createNoteRequests).toEqual([
      {
        applicationId: 'app_e2e_2',
        payload: { content: 'Send a thank-you email.' },
      },
    ])
  })

  test('edits an existing note', async ({
    appApi,
    applicationDetailPage: detail,
  }) => {
    // Arrange
    await openNotes(detail)
    const original = DEFAULT_NOTES[0].content
    const updated = 'Initial screening moved to Friday.'

    // Act
    await detail.editNoteButton(original).click()
    const dialog = detail.page.getByRole('dialog')
    const textbox = dialog.getByRole('textbox')
    await expect(textbox).toHaveValue(original)
    await textbox.fill(updated)
    await dialog.getByRole('button', { name: 'Save changes' }).click()

    // Assert
    await expect(dialog).toBeHidden()
    await detail.expectNotesVisible([updated])
    await expect(detail.note(original)).toHaveCount(0)
    expect(appApi.updateNoteRequests).toEqual([
      {
        applicationId: 'app_e2e_2',
        noteId: DEFAULT_NOTES[0].id,
        payload: { content: updated },
      },
    ])
  })

  test('deletes a note', async ({
    appApi,
    applicationDetailPage: detail,
  }) => {
    // Arrange
    await openNotes(detail)
    const target = DEFAULT_NOTES[1].content

    // Act
    await detail.deleteNoteButton(target).click()

    // Assert — the note disappears and the API was called
    await expect(detail.note(target)).toHaveCount(0)
    expect(appApi.deleteNoteRequests).toEqual([
      { applicationId: 'app_e2e_2', noteId: DEFAULT_NOTES[1].id },
    ])
  })

  test('shows an error when notes cannot be loaded', async ({
    appApi,
    applicationDetailPage: detail,
  }) => {
    // Arrange — every notes list request fails
    appApi.failNotes({ status: 500, message: 'notes unavailable' })

    // Act
    await detail.page.goto('/app/applications/app_e2e_2')
    await detail.expectLoaded('Globex', 'Staff Engineer')

    // Assert
    await expect(
      detail.page.getByText('Could not load notes.', { exact: true }),
    ).toBeVisible()
    await expect(detail.noteCard(NEWEST_FIRST[0])).toHaveCount(0)
  })

  test('keeps the dialog open and reports an error when creating fails', async ({
    appApi,
    applicationDetailPage: detail,
  }) => {
    // Arrange
    appApi.failCreateNote({ status: 500, message: 'create failed' })
    await openNotes(detail)
    const content = 'This one should fail.'

    // Act
    await detail.notesAddButton.click()
    const dialog = detail.page.getByRole('dialog')
    await dialog.getByRole('textbox').fill(content)
    await dialog.getByRole('button', { name: 'Add note' }).click()

    // Assert — the dialog stays open with the entered value
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('textbox')).toHaveValue(content)
    // Assert — the page surfaces the failure (snackbar lives outside the dialog)
    await expect(
      detail.page.getByText('Failed to add the note.', { exact: true }),
    ).toBeVisible()
    expect(appApi.createNoteRequests).toHaveLength(1)
  })

  test('keeps the note and reports an error when deleting fails', async ({
    appApi,
    applicationDetailPage: detail,
  }) => {
    // Arrange
    appApi.failDeleteNote({ status: 500, message: 'delete failed' })
    await openNotes(detail)
    const target = DEFAULT_NOTES[2].content

    // Act
    await detail.deleteNoteButton(target).click()

    // Assert — the note is still there and the failure is surfaced
    await detail.expectNotesVisible([target])
    await expect(
      detail.page.getByText('Failed to delete the note.', { exact: true }),
    ).toBeVisible()
    expect(appApi.deleteNoteRequests).toHaveLength(1)
  })

  test('shows the empty state when an application has no notes', async ({
    appApi,
    applicationDetailPage: detail,
  }) => {
    // Arrange
    appApi.setNotes([buildNote({ id: 'note_other', applicationId: 'app_e2e_1' })])

    // Act
    await openNotes(detail)

    // Assert
    await expect(
      detail.page.getByText('No notes yet', { exact: true }),
    ).toBeVisible()
    await expect(
      detail.page.getByRole('button', { name: 'Add your first note' }),
    ).toBeVisible()
  })
})
