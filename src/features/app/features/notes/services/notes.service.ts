import { api } from '@/lib/api.library'

// ── API contract ────────────────────────────────────────────────────────────
//
// Request/response shapes for the `application-notes` endpoints, mirroring the
// NestJS API (`X-Api-Version: 1`, cookie-session auth). They are co-located with
// the service so it stays self-contained, following the interviews module.

/** A note (comment) as returned by the API (dates are ISO strings). */
export interface ApplicationNote {
  id: string
  applicationId: string
  content: string
  createdAt: string
  updatedAt: string
}

/** Payload accepted by `POST /applications/:id/notes`. */
export interface CreateNotePayload {
  content: string
}

/** Payload accepted by `PATCH /applications/:id/notes/:noteId`. */
export type UpdateNotePayload = Partial<CreateNotePayload>

/**
 * NotesService
 * Service for reading and managing the comment-style notes attached to job
 * applications. It is the single entry point for the notes endpoints and is
 * meant to be consumed by TanStack Query hooks.
 */
class NotesService {
  /**
   * Lists every note belonging to a job application.
   * @param   {string} applicationId - The application ID.
   * @returns {Promise<ApplicationNote[]>} Notes ordered by `createdAt` descending.
   */
  fetchApplicationNotes(applicationId: string): Promise<ApplicationNote[]> {
    return api.get<ApplicationNote[]>(`/applications/${applicationId}/notes`)
  }

  /**
   * Creates a note for a job application.
   * @param   {string} applicationId - The application ID.
   * @param   {CreateNotePayload} payload - The note content.
   * @returns {Promise<ApplicationNote>} The created note.
   */
  createNote(
    applicationId: string,
    payload: CreateNotePayload
  ): Promise<ApplicationNote> {
    return api.post<ApplicationNote>(
      `/applications/${applicationId}/notes`,
      payload
    )
  }

  /**
   * Partially updates a note.
   * @param   {string} applicationId - The parent application ID.
   * @param   {string} noteId - The note ID.
   * @param   {UpdateNotePayload} payload - The fields to update.
   * @returns {Promise<ApplicationNote>} The updated note.
   */
  updateNote(
    applicationId: string,
    noteId: string,
    payload: UpdateNotePayload
  ): Promise<ApplicationNote> {
    return api.patch<ApplicationNote>(
      `/applications/${applicationId}/notes/${noteId}`,
      payload
    )
  }

  /**
   * Deletes a note.
   * @param   {string} applicationId - The parent application ID.
   * @param   {string} noteId - The note ID.
   * @returns {Promise<void>} The API replies with 204 No Content.
   */
  deleteNote(
    applicationId: string,
    noteId: string
  ): Promise<void> {
    return api.delete<void>(
      `/applications/${applicationId}/notes/${noteId}`
    )
  }
}

export { NotesService }

/** Shared instance used by the note query hooks. */
export const notesService = new NotesService()
