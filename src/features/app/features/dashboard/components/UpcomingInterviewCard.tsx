import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import EventIcon from '@mui/icons-material/Event'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import type { JobApplication } from '@/features/app/features/applications'
import type {
  InterviewType,
  JobApplicationInterview
} from '@/features/app/features/interviews'
import { getDeviceTimezone } from '@/lib/device-settings'

/** Translation key of each interview type label. */
const INTERVIEW_TYPE_LABEL_KEYS = {
  SCREENING: 'upcomingInterview.types.screening',
  PHONE: 'upcomingInterview.types.phone',
  TECHNICAL: 'upcomingInterview.types.technical',
  FINAL: 'upcomingInterview.types.final',
  HR: 'upcomingInterview.types.hr',
  OTHER: 'upcomingInterview.types.other'
} as const satisfies Record<InterviewType, string>

/** Props for {@link UpcomingInterviewCard}. */
interface UpcomingInterviewCardProps {
  /** The scheduled interview. */
  interview: JobApplicationInterview
  /** The application the interview belongs to. */
  application: JobApplication
  /** Optional click handler; the card is disabled when omitted. */
  onClick?: () => void
}

/**
 * Highlighted card showing the next scheduled interview.
 *
 * Date and time are rendered in the device timezone and localised with the
 * active i18n language.
 */
export function UpcomingInterviewCard({
  interview,
  application,
  onClick
}: Readonly<UpcomingInterviewCardProps>) {
  const { t, i18n } = useTranslation('dashboard')

  const timezone = getDeviceTimezone()
  const scheduledAt = interview.scheduledAt
    ? new Date(interview.scheduledAt)
    : null
  const dateLabel = scheduledAt
    ? new Intl.DateTimeFormat(i18n.language, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: timezone
      }).format(scheduledAt)
    : null
  const timeLabel = scheduledAt
    ? new Intl.DateTimeFormat(i18n.language, {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: timezone
      }).format(scheduledAt)
    : null

  const typeLabel = t(INTERVIEW_TYPE_LABEL_KEYS[interview.type])
  const heading = dateLabel
    ? `${t('upcomingInterview.heading')} — ${dateLabel}`
    : t('upcomingInterview.heading')
  const detail = timeLabel
    ? t('upcomingInterview.typeAndTime', { type: typeLabel, time: timeLabel })
    : typeLabel

  return (
    <Card
      sx={{ borderRadius: 3, bgcolor: '#7C3AED', color: '#fff' }}
      elevation={0}
    >
      <CardActionArea
        onClick={onClick}
        disabled={!onClick}
        sx={{ p: 2 }}
        aria-label={t('upcomingInterview.ariaLabel', {
          type: typeLabel,
          company: application.companyName
        })}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: '#fff',
              width: 44,
              height: 44
            }}
            aria-hidden="true"
          >
            <EventIcon />
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{ opacity: 0.8, letterSpacing: 0.3, fontWeight: 600 }}
            >
              {heading}
            </Typography>
            <Typography
              variant="subtitle2"
              noWrap
              title={`${application.positionTitle} @ ${application.companyName}`}
              sx={{ fontWeight: 700 }}
            >
              {t('upcomingInterview.positionAtCompany', {
                position: application.positionTitle,
                company: application.companyName
              })}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {detail}
            </Typography>
          </Box>

          {onClick && (
            <ChevronRightIcon
              sx={{ opacity: 0.5, flexShrink: 0 }}
              aria-hidden="true"
            />
          )}
        </Box>
      </CardActionArea>
    </Card>
  )
}
