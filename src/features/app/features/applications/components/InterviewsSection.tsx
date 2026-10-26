import AddIcon from '@mui/icons-material/Add'
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined'
import EventOutlinedIcon from '@mui/icons-material/EventOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useApplicationInterviews,
  useCreateInterview,
  useDeleteInterview,
  useUpdateInterview,
  type CreateInterviewPayload,
  type InterviewType,
  type JobApplicationInterview
} from '@/features/app/features/interviews'
import { getDeviceTimezone } from '@/lib/device-settings'
import { InterviewFormDialog } from './InterviewFormDialog'

/** Icon used for each interview type. */
const INTERVIEW_TYPE_ICONS = {
  SCREENING: SearchOutlinedIcon,
  PHONE: PhoneOutlinedIcon,
  TECHNICAL: CodeOutlinedIcon,
  FINAL: StarBorderOutlinedIcon,
  HR: PeopleOutlinedIcon,
  OTHER: EventOutlinedIcon
} as const satisfies Record<InterviewType, unknown>

/**
 * Formats an interview timestamp in a specific timezone.
 *
 * @param value - ISO timestamp.
 * @param timeZone - IANA timezone to render the timestamp in.
 * @param locale - BCP 47 locale used for month/day names.
 * @returns The formatted date and time, or `null` for invalid input/zone.
 */
function formatInTimeZone(
  value: string,
  timeZone: string,
  locale: string
): string | null {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone
    }).format(new Date(value))
  } catch {
    return null
  }
}

/** Props for the local {@link InterviewCard}. */
interface InterviewCardProps {
  /** Interview rendered by the card. */
  interview: JobApplicationInterview
  /** Whether edit/delete actions are available. */
  canEdit: boolean
  /** Opens the edit form. */
  onEdit: () => void
  /** Deletes the interview. */
  onDelete: () => void
}

/**
 * Card summarising one interview: type, schedule (in the interview timezone and
 * the device timezone when they differ), location, notes and actions.
 */
function InterviewCard({
  interview,
  canEdit,
  onEdit,
  onDelete
}: Readonly<InterviewCardProps>) {
  const { t, i18n } = useTranslation('applications')

  const TypeIcon = INTERVIEW_TYPE_ICONS[interview.type]
  const typeLabel = t(`interviews.types.${interview.type}`)

  const deviceTimezone = getDeviceTimezone()
  const interviewTimezone = interview.timezone ?? deviceTimezone

  const localLabel = interview.scheduledAt
    ? formatInTimeZone(interview.scheduledAt, interviewTimezone, i18n.language)
    : null
  const deviceLabel = interview.scheduledAt
    ? formatInTimeZone(interview.scheduledAt, deviceTimezone, i18n.language)
    : null

  // Only repeat the schedule when it renders differently in both timezones.
  const showBothTimezones = Boolean(
    localLabel && deviceLabel && localLabel !== deviceLabel
  )

  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
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
        {/* Type icon */}
        <Box
          aria-hidden="true"
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.5,
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <TypeIcon sx={{ fontSize: 20, color: 'secondary.main' }} />
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'baseline' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {typeLabel}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('interviews.cardCaption')}
            </Typography>
          </Box>

          {interview.scheduledAt && (
            <Box sx={{ mt: 0.5 }}>
              {showBothTimezones ? (
                <>
                  {localLabel && (
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <ScheduleOutlinedIcon
                        sx={{ fontSize: 13, color: 'text.secondary' }}
                        aria-hidden="true"
                      />
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary' }}
                      >
                        {t('interviews.scheduledAt', {
                          date: localLabel,
                          timezone: interviewTimezone
                        })}
                      </Typography>
                    </Box>
                  )}
                  {deviceLabel && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mt: 0.25
                      }}
                    >
                      <ScheduleOutlinedIcon
                        sx={{ fontSize: 13, color: 'text.secondary' }}
                        aria-hidden="true"
                      />
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary' }}
                      >
                        {t('interviews.scheduledAt', {
                          date: deviceLabel,
                          timezone: deviceTimezone
                        })}
                      </Typography>
                    </Box>
                  )}
                </>
              ) : (
                deviceLabel && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ScheduleOutlinedIcon
                      sx={{ fontSize: 13, color: 'text.secondary' }}
                      aria-hidden="true"
                    />
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary' }}
                    >
                      {t('interviews.scheduledAt', {
                        date: deviceLabel,
                        timezone: deviceTimezone
                      })}
                    </Typography>
                  </Box>
                )
              )}
            </Box>
          )}

          {interview.location && (
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}
            >
              <LocationOnOutlinedIcon
                sx={{ fontSize: 13, color: 'text.secondary' }}
                aria-hidden="true"
              />
              <Typography
                variant="caption"
                noWrap
                sx={{ color: 'text.secondary', maxWidth: '100%' }}
              >
                {interview.location}
              </Typography>
            </Box>
          )}

          {interview.notes && (
            <Typography
              variant="caption"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                mt: 0.75,
                color: 'text.secondary'
              }}
            >
              {interview.notes}
            </Typography>
          )}
        </Box>

        {/* Actions */}
        {canEdit && (
          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
            <Tooltip title={t('interviews.edit')}>
              <IconButton
                size="small"
                onClick={onEdit}
                aria-label={t('interviews.editLabel', { type: typeLabel })}
              >
                <EditOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('interviews.delete')}>
              <IconButton
                size="small"
                color="error"
                onClick={onDelete}
                aria-label={t('interviews.deleteLabel', { type: typeLabel })}
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

/** Props for {@link InterviewsSection}. */
interface InterviewsSectionProps {
  /** Application the interviews belong to. */
  applicationId: string
  /** Whether the interviews can be added, edited and removed. */
  canEdit: boolean
  /** Reports a result message to the page's snackbar. */
  onSnackbar: (message: string) => void
}

/**
 * Interviews of an application: list, empty state and the add/edit dialog.
 */
export function InterviewsSection({
  applicationId,
  canEdit,
  onSnackbar
}: Readonly<InterviewsSectionProps>) {
  const { t } = useTranslation('applications')

  const { data: interviews = [], isPending, isError } =
    useApplicationInterviews(applicationId)

  const createMutation = useCreateInterview()
  const updateMutation = useUpdateInterview()
  const deleteMutation = useDeleteInterview()

  const [formOpen, setFormOpen] = useState(false)
  // Incremented per opening so the form dialog remounts with fresh state.
  const [formSession, setFormSession] = useState(0)
  const [editingInterview, setEditingInterview] = useState<
    JobApplicationInterview | undefined
  >()

  function openAdd() {
    setEditingInterview(undefined)
    setFormSession((session) => session + 1)
    setFormOpen(true)
  }

  function openEdit(interview: JobApplicationInterview) {
    setEditingInterview(interview)
    setFormSession((session) => session + 1)
    setFormOpen(true)
  }

  async function handleFormSubmit(payload: CreateInterviewPayload) {
    try {
      if (editingInterview) {
        await updateMutation.mutateAsync({
          applicationId,
          interviewId: editingInterview.id,
          payload
        })
        onSnackbar(t('messages.interviewUpdated'))
      } else {
        await createMutation.mutateAsync({ applicationId, payload })
        onSnackbar(t('messages.interviewCreated'))
      }
      setFormOpen(false)
    } catch (error) {
      onSnackbar(
        t(
          editingInterview
            ? 'messages.interviewUpdateFailed'
            : 'messages.interviewCreateFailed'
        )
      )
      // Rethrow so the dialog stays open with the entered values.
      throw error
    }
  }

  async function handleDelete(interview: JobApplicationInterview) {
    try {
      await deleteMutation.mutateAsync({
        applicationId,
        interviewId: interview.id
      })
      onSnackbar(t('messages.interviewDeleted'))
    } catch {
      onSnackbar(t('messages.interviewDeleteFailed'))
    }
  }

  return (
    <Box>
      {/* Section header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <EventNoteOutlinedIcon
          sx={{ fontSize: 20, color: 'text.secondary' }}
          aria-hidden="true"
        />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {t('interviews.title')}
        </Typography>
        <Box sx={{ flex: 1 }} />
        {canEdit && (
          <Button
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={openAdd}
            sx={{ textTransform: 'none' }}
          >
            {t('interviews.add')}
          </Button>
        )}
      </Box>

      {/* Interview list */}
      {isPending && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress
            size={24}
            aria-label={t('interviews.loading')}
          />
        </Box>
      )}

      {isError && !isPending && (
        <Typography
          variant="body2"
          sx={{ py: 2, textAlign: 'center', color: 'error.main' }}
        >
          {t('interviews.loadError')}
        </Typography>
      )}

      {!isPending && !isError && interviews.length === 0 && (
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
          <EventAvailableOutlinedIcon
            sx={{ fontSize: 36, mb: 1, color: 'text.disabled' }}
            aria-hidden="true"
          />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('interviews.empty')}
          </Typography>
          {canEdit && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon sx={{ fontSize: 14 }} />}
              onClick={openAdd}
              sx={{ mt: 1.5, textTransform: 'none' }}
            >
              {t('interviews.addInterview')}
            </Button>
          )}
        </Box>
      )}

      {!isPending &&
        !isError &&
        interviews.map((interview) => (
          <InterviewCard
            key={interview.id}
            interview={interview}
            canEdit={canEdit}
            onEdit={() => openEdit(interview)}
            onDelete={() => void handleDelete(interview)}
          />
        ))}

      <InterviewFormDialog
        key={formSession}
        open={formOpen}
        existingInterview={editingInterview}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />
    </Box>
  )
}
