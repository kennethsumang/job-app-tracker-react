import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  ApplicationNote,
  CreateNotePayload
} from '@/features/app/features/notes'

/** Props for {@link NoteFormDialog}. */
interface NoteFormDialogProps {
  /** Whether the dialog is visible. */
  open: boolean
  /** Note being edited; omit to add a new one. */
  existingNote?: ApplicationNote
  /** Closes the dialog without saving. */
  onClose: () => void
  /** Persists the payload; the dialog closes when it resolves. */
  onSubmit: (payload: CreateNotePayload) => Promise<void>
}

/**
 * Create/edit dialog for a comment-style note.
 *
 * Mount it with a `key` per opening: the initial state is taken from the props
 * on mount.
 */
export function NoteFormDialog({
  open,
  existingNote,
  onClose,
  onSubmit
}: Readonly<NoteFormDialogProps>) {
  const { t } = useTranslation('applications')
  const titleId = useId()

  const isEdit = Boolean(existingNote)
  const [content, setContent] = useState(existingNote?.content ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit() {
    const trimmed = content.trim()
    if (!trimmed) {
      setError(t('notes.form.contentRequired'))
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      await onSubmit({ content: trimmed })
      onClose()
    } catch {
      // Keep the dialog open with the entered values so the user can retry;
      // the caller is responsible for surfacing the error.
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby={titleId}
    >
      <DialogTitle id={titleId}>
        {isEdit ? t('notes.form.editTitle') : t('notes.form.createTitle')}
      </DialogTitle>
      <DialogContent>
        <Box
          component="form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            void handleSubmit()
          }}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}
        >
          <TextField
            label={t('notes.form.content')}
            placeholder={t('notes.form.contentPlaceholder')}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            error={Boolean(error)}
            helperText={error ?? ' '}
            disabled={isSubmitting}
            required
            multiline
            minRows={4}
            fullWidth
            slotProps={{ htmlInput: { 'aria-required': 'true' } }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={onClose} disabled={isSubmitting}>
              {t('notes.form.cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={16} color="inherit" />
                ) : null
              }
            >
              {isEdit ? t('notes.form.save') : t('notes.form.create')}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
