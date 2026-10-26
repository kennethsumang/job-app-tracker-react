import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { JOB_APPLICATION_STATUSES } from '../constants'
import type {
  JobApplicationStatus,
  UpdateApplicationStatusPayload
} from '../services/applications.service'

/** Props for {@link StatusChangeDialog}. */
interface StatusChangeDialogProps {
  /** Whether the dialog is visible. */
  open: boolean
  /** Status the application currently has. */
  currentStatus: JobApplicationStatus
  /** Closes the dialog without saving. */
  onClose: () => void
  /** Persists the change; the caller closes the dialog when it resolves. */
  onSubmit: (payload: UpdateApplicationStatusPayload) => Promise<void>
}

/**
 * Today's date as `YYYY-MM-DD`, for the "changed on" default.
 *
 * @returns The local date in the format expected by `input[type=date]`.
 */
function todayInputValue(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

/**
 * Converts a date input value into an ISO timestamp the API accepts.
 *
 * A date-only value is parsed as UTC midnight, which can be in the future for
 * users ahead of UTC; those are clamped to "now" because the API rejects future
 * timestamps.
 *
 * @param value - Date input value (`YYYY-MM-DD`).
 * @returns ISO timestamp.
 */
function toIsoTimestamp(value: string): string {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime()) || parsed.getTime() > Date.now()) {
    return new Date().toISOString()
  }

  return parsed.toISOString()
}

/**
 * Dialog that changes the status of an application and the date it happened.
 *
 * Mount it with a `key` per opening: the initial state is taken from the props
 * on mount.
 */
export function StatusChangeDialog({
  open,
  currentStatus,
  onClose,
  onSubmit
}: Readonly<StatusChangeDialogProps>) {
  const { t } = useTranslation('applications')
  const titleId = useId()

  const [status, setStatus] = useState(currentStatus)
  const [changedAt, setChangedAt] = useState(todayInputValue)
  const [changedAtError, setChangedAtError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit() {
    if (!changedAt) {
      setChangedAtError(t('statusDialog.changedOnRequired'))
      return
    }

    setChangedAtError(null)
    setIsSubmitting(true)
    try {
      await onSubmit({ status, changedAt: toIsoTimestamp(changedAt) })
      onClose()
    } catch {
      // Keep the dialog open with the chosen values so the user can retry;
      // the caller is responsible for surfacing the error.
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby={titleId}
    >
      <DialogTitle id={titleId}>{t('statusDialog.title')}</DialogTitle>
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
            select
            label={t('statusDialog.newStatus')}
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as JobApplicationStatus)
            }
            disabled={isSubmitting}
            fullWidth
          >
            {JOB_APPLICATION_STATUSES.map((candidate) => (
              <MenuItem key={candidate} value={candidate}>
                {t(`statuses.${candidate}`)}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label={t('statusDialog.changedOn')}
            type="date"
            value={changedAt}
            onChange={(event) => setChangedAt(event.target.value)}
            error={Boolean(changedAtError)}
            helperText={changedAtError ?? ' '}
            disabled={isSubmitting}
            fullWidth
            required
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { 'aria-required': 'true' }
            }}
          />

          <DialogActions sx={{ px: 0, pb: 0 }}>
            <Button onClick={onClose} disabled={isSubmitting}>
              {t('statusDialog.cancel')}
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                t('statusDialog.save')
              )}
            </Button>
          </DialogActions>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
