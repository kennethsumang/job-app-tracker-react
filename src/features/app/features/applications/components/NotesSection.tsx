import AddIcon from '@mui/icons-material/Add'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined'
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  sortNotesByCreatedAt,
  useApplicationNotes,
  useCreateNote,
  useDeleteNote,
  useUpdateNote,
  type ApplicationNote,
  type CreateNotePayload,
  type NoteSortOrder
} from '@/features/app/features/notes'
import { getDeviceTimezone } from '@/lib/device-settings'
import { formatDateTimeInTimeZone } from '@/lib/format-datetime'
import { NoteFormDialog } from './NoteFormDialog'

/** Props for the local {@link NoteCard}. */
interface NoteCardProps {
  /** Note rendered by the card. */
  note: ApplicationNote
  /** Whether edit/delete actions are available. */
  canEdit: boolean
  /** Opens the edit form. */
  onEdit: () => void
  /** Deletes the note. */
  onDelete: () => void
}

/**
 * Card summarising one note: its content, creation date in the device
 * timezone, and the edit/delete actions.
 */
function NoteCard({
  note,
  canEdit,
  onEdit,
  onDelete
}: Readonly<NoteCardProps>) {
  const { t, i18n } = useTranslation('applications')

  const deviceTimezone = getDeviceTimezone()
  const createdAtLabel = formatDateTimeInTimeZone(
    note.createdAt,
    deviceTimezone,
    i18n.language
  )

  return (
    <Card component="article" variant="outlined" sx={{ mb: 1 }}>
      <CardContent
        sx={{
          display: 'flex',
          gap: 1.5,
          alignItems: 'flex-start',
          px: 2,
          py: 1.5,
          '&:last-child': { pb: 1.5 }
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {note.content}
          </Typography>

          {createdAtLabel && (
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}
            >
              <ScheduleOutlinedIcon
                sx={{ fontSize: 13, color: 'text.secondary' }}
                aria-hidden="true"
              />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('notes.createdAt', {
                  date: createdAtLabel,
                  timezone: deviceTimezone
                })}
              </Typography>
            </Box>
          )}
        </Box>

        {canEdit && (
          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
            <Tooltip title={t('notes.edit')}>
              <IconButton
                size="small"
                onClick={onEdit}
                aria-label={t('notes.edit')}
              >
                <EditOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('notes.delete')}>
              <IconButton
                size="small"
                color="error"
                onClick={onDelete}
                aria-label={t('notes.delete')}
              >
                <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

/** Props for {@link NotesSection}. */
interface NotesSectionProps {
  /** Application the notes belong to. */
  applicationId: string
  /** Whether notes can be added, edited and removed. */
  canEdit: boolean
  /** Reports a result message to the page's snackbar. */
  onSnackbar: (message: string) => void
}

/**
 * Notes of an application: sortable list, empty state and the add/edit
 * dialog.
 */
export function NotesSection({
  applicationId,
  canEdit,
  onSnackbar
}: Readonly<NotesSectionProps>) {
  const { t } = useTranslation('applications')

  const { data: notes = [], isPending, isError } =
    useApplicationNotes(applicationId)

  const createMutation = useCreateNote()
  const updateMutation = useUpdateNote()
  const deleteMutation = useDeleteNote()

  // Newest first by default; the API also returns newest first.
  const [sortOrder, setSortOrder] = useState<NoteSortOrder>('desc')
  const [formOpen, setFormOpen] = useState(false)
  // Incremented per opening so the form dialog remounts with fresh state.
  const [formSession, setFormSession] = useState(0)
  const [editingNote, setEditingNote] = useState<ApplicationNote | undefined>()

  const sortedNotes = useMemo(
    () => sortNotesByCreatedAt(notes, sortOrder),
    [notes, sortOrder]
  )

  function openAdd() {
    setEditingNote(undefined)
    setFormSession((session) => session + 1)
    setFormOpen(true)
  }

  function openEdit(note: ApplicationNote) {
    setEditingNote(note)
    setFormSession((session) => session + 1)
    setFormOpen(true)
  }

  async function handleFormSubmit(payload: CreateNotePayload) {
    try {
      if (editingNote) {
        await updateMutation.mutateAsync({
          applicationId,
          noteId: editingNote.id,
          payload
        })
        onSnackbar(t('messages.noteUpdated'))
      } else {
        await createMutation.mutateAsync({ applicationId, payload })
        onSnackbar(t('messages.noteCreated'))
      }
      setFormOpen(false)
    } catch (error) {
      onSnackbar(
        t(
          editingNote
            ? 'messages.noteUpdateFailed'
            : 'messages.noteCreateFailed'
        )
      )
      // Rethrow so the dialog stays open with the entered values.
      throw error
    }
  }

  async function handleDelete(note: ApplicationNote) {
    try {
      await deleteMutation.mutateAsync({ applicationId, noteId: note.id })
      onSnackbar(t('messages.noteDeleted'))
    } catch {
      onSnackbar(t('messages.noteDeleteFailed'))
    }
  }

  return (
    <Box>
      {/* Section header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1,
          flexWrap: 'wrap'
        }}
      >
        <NotesOutlinedIcon
          sx={{ fontSize: 20, color: 'text.secondary' }}
          aria-hidden="true"
        />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {t('notes.title')}
        </Typography>
        <Box sx={{ flex: 1 }} />

        <ToggleButtonGroup
          size="small"
          exclusive
          value={sortOrder}
          onChange={(_event, value: NoteSortOrder | null) => {
            if (value) setSortOrder(value)
          }}
          aria-label={t('notes.sortLabel')}
        >
          <ToggleButton
            value="desc"
            aria-label={t('notes.sortNewestFirst')}
          >
            <ArrowDownwardIcon sx={{ fontSize: 16 }} />
          </ToggleButton>
          <ToggleButton value="asc" aria-label={t('notes.sortOldestFirst')}>
            <ArrowUpwardIcon sx={{ fontSize: 16 }} />
          </ToggleButton>
        </ToggleButtonGroup>

        {canEdit && (
          <Button
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={openAdd}
            sx={{ textTransform: 'none' }}
          >
            {t('notes.add')}
          </Button>
        )}
      </Box>

      {/* Note list */}
      {isPending && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} aria-label={t('notes.loading')} />
        </Box>
      )}

      {isError && !isPending && (
        <Typography
          variant="body2"
          sx={{ py: 2, textAlign: 'center', color: 'error.main' }}
        >
          {t('notes.loadError')}
        </Typography>
      )}

      {!isPending && !isError && sortedNotes.length === 0 && (
        <Box
          sx={{
            py: 3.5,
            px: 2,
            textAlign: 'center',
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 2
          }}
        >
          <NotesOutlinedIcon
            sx={{ fontSize: 36, mb: 1, color: 'text.disabled' }}
            aria-hidden="true"
          />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('notes.empty')}
          </Typography>
          {canEdit && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon sx={{ fontSize: 14 }} />}
              onClick={openAdd}
              sx={{ mt: 1.5, textTransform: 'none' }}
            >
              {t('notes.addNote')}
            </Button>
          )}
        </Box>
      )}

      {!isPending &&
        !isError &&
        sortedNotes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            canEdit={canEdit}
            onEdit={() => openEdit(note)}
            onDelete={() => void handleDelete(note)}
          />
        ))}

      <NoteFormDialog
        key={formSession}
        open={formOpen}
        existingNote={editingNote}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />
    </Box>
  )
}
