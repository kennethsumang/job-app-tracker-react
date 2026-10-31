import type { ApplicationNote } from '@/features/app/features/notes/services/notes.service'

/** Sort direction for a notes list. */
export type NoteSortOrder = 'asc' | 'desc'

/**
 * Sorts notes by their creation timestamp.
 *
 * The input is never mutated; a new array is returned. Equal timestamps keep
 * their original relative order.
 *
 * @param   {readonly ApplicationNote[]} notes - Notes to sort.
 * @param   {NoteSortOrder} order - `asc` = oldest first, `desc` = newest first.
 * @returns {ApplicationNote[]} A new, sorted array.
 */
export function sortNotesByCreatedAt(
  notes: readonly ApplicationNote[],
  order: NoteSortOrder
): ApplicationNote[] {
  const direction = order === 'asc' ? 1 : -1

  return [...notes].sort((left, right) => {
    const delta = Date.parse(left.createdAt) - Date.parse(right.createdAt)
    return delta === 0 ? 0 : delta * direction
  })
}
