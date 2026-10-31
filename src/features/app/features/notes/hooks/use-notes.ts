import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions
} from '@tanstack/react-query'
import {
  notesService,
  type ApplicationNote,
  type CreateNotePayload,
  type UpdateNotePayload
} from '@/features/app/features/notes/services/notes.service'

/**
 * Cache keys for the notes domain.
 *
 * Every note query lives under the `["notes"]` prefix, so a single invalidation
 * refreshes all per-application note lists after a mutation.
 */
export const notesKeys = {
  all: ['notes'] as const,
  lists: () => [...notesKeys.all, 'list'] as const,
  application: (applicationId: string) =>
    [...notesKeys.lists(), applicationId] as const
}

/** Extra TanStack Query options accepted by the note query hooks. */
type NotesQueryOptions<T> = Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>

/** Fetches every note belonging to a job application. */
export function useApplicationNotes(
  applicationId: string,
  options?: NotesQueryOptions<ApplicationNote[]>
) {
  return useQuery<ApplicationNote[]>({
    queryKey: notesKeys.application(applicationId),
    queryFn: () => notesService.fetchApplicationNotes(applicationId),
    enabled: Boolean(applicationId),
    ...options
  })
}

/** Variables accepted by {@link useCreateNote}. */
export interface CreateNoteVariables {
  applicationId: string
  payload: CreateNotePayload
}

/** Creates a note and invalidates the notes cache. */
export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation<ApplicationNote, Error, CreateNoteVariables>({
    mutationFn: ({ applicationId, payload }) =>
      notesService.createNote(applicationId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notesKeys.all })
    },
    throwOnError: false
  })
}

/** Variables accepted by {@link useUpdateNote}. */
export interface UpdateNoteVariables {
  applicationId: string
  noteId: string
  payload: UpdateNotePayload
}

/** Partially updates a note and invalidates the notes cache. */
export function useUpdateNote() {
  const queryClient = useQueryClient()

  return useMutation<ApplicationNote, Error, UpdateNoteVariables>({
    mutationFn: ({ applicationId, noteId, payload }) =>
      notesService.updateNote(applicationId, noteId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notesKeys.all })
    },
    throwOnError: false
  })
}

/** Variables accepted by {@link useDeleteNote}. */
export interface DeleteNoteVariables {
  applicationId: string
  noteId: string
}

/** Soft-deletes a note and invalidates the notes cache. */
export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, DeleteNoteVariables>({
    mutationFn: ({ applicationId, noteId }) =>
      notesService.deleteNote(applicationId, noteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notesKeys.all })
    },
    throwOnError: false
  })
}
