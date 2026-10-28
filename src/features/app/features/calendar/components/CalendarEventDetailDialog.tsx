import type { EventApi } from '@fullcalendar/core'
import EventIcon from '@mui/icons-material/Event'
import WorkIcon from '@mui/icons-material/Work'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { applicationsPaths } from '@/features/app/features/applications'
import dayjs from '@/lib/dayjs'
import { getDeviceTimezone } from '@/lib/device-settings'
import type { CalendarEventExtendedProps } from '../types'
import {
  APPLIED_EVENT_COLOR,
  INTERVIEW_EVENT_COLOR
} from '../types'

interface CalendarEventDetailDialogProps {
  open: boolean
  date: Date | null
  events: EventApi[]
  onClose: () => void
}

/**
 * Dialog listing every calendar event on the selected day.
 *
 * Each row links to the application the event belongs to.
 */
export function CalendarEventDetailDialog({
  open,
  date,
  events,
  onClose
}: Readonly<CalendarEventDetailDialogProps>) {
  const { t } = useTranslation('calendar')
  const navigate = useNavigate()
  const deviceTimezone = getDeviceTimezone()

  const dateLabel = date
    ? dayjs(date).tz(deviceTimezone).format('dddd, MMMM D, YYYY')
    : ''

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{dateLabel}</DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 0 }}>
        {events.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">{t('dialog.empty')}</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {events.map((event, index) => {
              const props = event.extendedProps as CalendarEventExtendedProps
              const isInterview = props.kind === 'interview'

              const primaryText = isInterview
                ? t('dialog.interviewPrimary', {
                    type: t(`types.${props.interviewType ?? 'OTHER'}`)
                  })
                : t('eventTypes.applied')

              const secondaryLines: string[] = [
                `${props.companyName} — ${props.positionTitle}`
              ]

              if (isInterview && props.scheduledAt) {
                secondaryLines.push(
                  dayjs
                    .utc(props.scheduledAt)
                    .tz(deviceTimezone)
                    .format('h:mm A')
                )
              }
              if (isInterview && props.location) {
                secondaryLines.push(props.location)
              }

              return (
                <Box key={event.id}>
                  {index > 0 && <Divider component="li" />}
                  <ListItemButton
                    alignItems="flex-start"
                    sx={{ py: 1.5 }}
                    onClick={() => {
                      onClose()
                      void navigate(
                        applicationsPaths.detail(props.applicationId)
                      )
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                      {isInterview ? (
                        <EventIcon
                          sx={{ color: INTERVIEW_EVENT_COLOR }}
                          fontSize="small"
                        />
                      ) : (
                        <WorkIcon
                          sx={{ color: APPLIED_EVENT_COLOR }}
                          fontSize="small"
                        />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap'
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 500 }}
                          >
                            {primaryText}
                          </Typography>
                          <Chip
                            label={
                              isInterview
                                ? t('eventTypes.interview')
                                : t('eventTypes.applied')
                            }
                            size="small"
                            sx={{
                              bgcolor: isInterview
                                ? INTERVIEW_EVENT_COLOR
                                : APPLIED_EVENT_COLOR,
                              color: 'white',
                              fontSize: '0.7rem',
                              height: 20
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box component="span" sx={{ display: 'block' }}>
                          {secondaryLines.map((line) => (
                            <Typography
                              key={line}
                              component="span"
                              variant="body2"
                              color="text.secondary"
                              sx={{ display: 'block' }}
                            >
                              {line}
                            </Typography>
                          ))}
                          {isInterview && props.interviewNotes && (
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                display: 'block',
                                mt: 0.5,
                                fontStyle: 'italic'
                              }}
                            >
                              {props.interviewNotes}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                </Box>
              )
            })}
          </List>
        )}
      </DialogContent>
    </Dialog>
  )
}
