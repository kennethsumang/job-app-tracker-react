import type {
  DatesSetArg,
  EventApi,
  EventClickArg
} from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import type { DateClickArg } from '@fullcalendar/interaction'
import interactionPlugin from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from '@/lib/dayjs'
import { getDeviceTimezone } from '@/lib/device-settings'
import { useCalendarData } from '../hooks/use-calendar'
import { buildCalendarEvents } from '../utils/calendar-events'
import { CalendarEventDetailDialog } from './CalendarEventDetailDialog'

interface DayDialogState {
  open: boolean
  date: Date | null
  events: EventApi[]
}

/**
 * Interactive month calendar built on FullCalendar.
 *
 * Interviews and application "applied" dates are fetched for the visible range
 * and rendered as colored events. Clicking a day (or an event) opens a dialog
 * listing that day's events.
 */
export function CalendarView() {
  const { t } = useTranslation('calendar')
  const deviceTimezone = getDeviceTimezone()

  const [visibleRange, setVisibleRange] = useState({
    from: dayjs().tz(deviceTimezone).startOf('month').utc().toISOString(),
    to: dayjs()
      .tz(deviceTimezone)
      .endOf('month')
      .add(1, 'day')
      .utc()
      .toISOString()
  })

  const [dialogState, setDialogState] = useState<DayDialogState>({
    open: false,
    date: null,
    events: []
  })

  const calendarRef = useRef<InstanceType<typeof FullCalendar>>(null)

  const { interviewsData, interviewsLoading, applicationsData, applicationsLoading } =
    useCalendarData(visibleRange, deviceTimezone)

  const isLoading = interviewsLoading || applicationsLoading

  const events = useMemo(
    () =>
      buildCalendarEvents(interviewsData, applicationsData, deviceTimezone, {
        interviewType: (type) => t(`types.${type}`),
        applied: t('eventTypes.applied'),
        unknown: t('unknown')
      }),
    [interviewsData, applicationsData, deviceTimezone, t]
  )

  const handleDatesSet = useCallback(
    (dateInfo: DatesSetArg) => {
      setVisibleRange({
        from: dayjs(dateInfo.start).tz(deviceTimezone).utc().toISOString(),
        to: dayjs(dateInfo.end).tz(deviceTimezone).utc().toISOString()
      })
    },
    [deviceTimezone]
  )

  const openDayDialog = useCallback(
    (date: Date) => {
      const calendarApi = calendarRef.current?.getApi()
      if (!calendarApi) return

      const dayStart = dayjs(date).tz(deviceTimezone).startOf('day')

      const dayEvents = calendarApi.getEvents().filter((event) => {
        const start = event.start
        if (!start) return false
        return dayjs(start).tz(deviceTimezone).isSame(dayStart, 'day')
      })

      setDialogState({ open: true, date, events: dayEvents })
    },
    [deviceTimezone]
  )

  const handleDateClick = useCallback(
    (arg: DateClickArg) => {
      openDayDialog(arg.date)
    },
    [openDayDialog]
  )

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      const eventDate = arg.event.start
      if (eventDate) openDayDialog(eventDate)
    },
    [openDayDialog]
  )

  const handleDialogClose = useCallback(() => {
    setDialogState((previous) => ({ ...previous, open: false }))
  }, [])

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <CircularProgress size={20} />
          <Typography variant="caption" color="text.secondary">
            {t('loading')}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          height: '100%',
          '& .fc': { height: '100%', fontFamily: 'inherit' },
          '& .fc-button': {
            textTransform: 'capitalize',
            fontFamily: 'inherit'
          },
          '& .fc-toolbar-title': { fontWeight: 600, fontSize: '1.1rem' },
          '& .fc-daygrid-day-number': { fontWeight: 500 },
          '& .fc-day-today .fc-daygrid-day-number': {
            bgcolor: 'primary.main',
            color: 'white',
            borderRadius: '50%',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          },
          '& .fc-event': { cursor: 'pointer', fontSize: '0.75rem' }
        }}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          height="100%"
          events={events}
          datesSet={handleDatesSet}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          dayMaxEvents={3}
          moreLinkClick="popover"
        />
      </Box>

      <CalendarEventDetailDialog
        open={dialogState.open}
        date={dialogState.date}
        events={dialogState.events}
        onClose={handleDialogClose}
      />
    </Box>
  )
}
