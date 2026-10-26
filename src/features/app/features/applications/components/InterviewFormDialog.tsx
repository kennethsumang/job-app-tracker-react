import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  COMMON_TIMEZONES,
  INTERVIEW_TYPES,
  type CreateInterviewPayload,
  type InterviewType,
  type JobApplicationInterview
} from '@/features/app/features/interviews'
import { getDeviceTimezone } from '@/lib/device-settings'
import dayjs from '@/lib/dayjs'

/** Props for {@link InterviewFormDialog}. */
interface InterviewFormDialogProps {
  /** Whether the dialog is visible. */
  open: boolean
  /** Interview being edited; omit to add a new one. */
  existingInterview?: JobApplicationInterview
  /** Closes the dialog without saving. */
  onClose: () => void
  /** Persists the payload; the dialog closes when it resolves. */
  onSubmit: (payload: CreateInterviewPayload) => Promise<void>
}

/**
 * Create/edit dialog for a job interview.
 *
 * The scheduled time is entered as a wall-clock value in the selected timezone
 * and converted to UTC before it is sent to the API. Mount it with a `key` per
 * opening: the initial state is taken from the props on mount.
 */
export function InterviewFormDialog({
  open,
  existingInterview,
  onClose,
  onSubmit
}: Readonly<InterviewFormDialogProps>) {
  const { t } = useTranslation('applications')
  const titleId = useId()

  const isEdit = Boolean(existingInterview)
  const initialTimezone = existingInterview?.timezone ?? getDeviceTimezone()

  const [type, setType] = useState<InterviewType>(
    existingInterview?.type ?? 'SCREENING'
  )
  const [timezone, setTimezone] = useState(initialTimezone)
  const [scheduledAt, setScheduledAt] = useState(
    existingInterview?.scheduledAt
      ? dayjs(existingInterview.scheduledAt)
          .tz(initialTimezone)
          .format('YYYY-MM-DDTHH:mm')
      : ''
  )
  const [location, setLocation] = useState(existingInterview?.location ?? '')
  const [notes, setNotes] = useState(existingInterview?.notes ?? '')

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit() {
    if (!scheduledAt) {
      setError(t('interviews.form.scheduledAtRequired'))
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      await onSubmit({
        type,
        scheduledAt: dayjs.tz(scheduledAt, timezone).utc().format(),
        timezone,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined
      })
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
        {isEdit
          ? t('interviews.form.editTitle')
          : t('interviews.form.createTitle')}
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
            select
            label={t('interviews.form.type')}
            value={type}
            onChange={(event) => setType(event.target.value as InterviewType)}
            disabled={isSubmitting}
            required
            fullWidth
          >
            {INTERVIEW_TYPES.map((interviewType) => (
              <MenuItem key={interviewType} value={interviewType}>
                {t(`interviews.types.${interviewType}`)}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label={t('interviews.form.scheduledAt')}
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              error={Boolean(error)}
              helperText={error ?? ' '}
              disabled={isSubmitting}
              required
              sx={{ flex: 1 }}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { 'aria-required': 'true' }
              }}
            />
            <TextField
              select
              label={t('interviews.form.timezone')}
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              disabled={isSubmitting}
              sx={{ minWidth: 180 }}
            >
              {COMMON_TIMEZONES.map((zone) => (
                <MenuItem key={zone} value={zone}>
                  {zone}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <TextField
            label={t('interviews.form.location')}
            placeholder={t('interviews.form.locationPlaceholder')}
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            disabled={isSubmitting}
            fullWidth
          />

          <TextField
            label={t('interviews.form.notes')}
            placeholder={t('interviews.form.notesPlaceholder')}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={isSubmitting}
            multiline
            minRows={3}
            fullWidth
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={onClose} disabled={isSubmitting}>
              {t('interviews.form.cancel')}
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
              {isEdit
                ? t('interviews.form.save')
                : t('interviews.form.create')}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
