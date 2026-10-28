import type { EventInput } from '@fullcalendar/core'
import type { JobApplication } from '@/features/app/features/applications'
import type {
  InterviewType,
  JobApplicationInterview
} from '@/features/app/features/interviews'
import dayjs from '@/lib/dayjs'
import type { CalendarEventExtendedProps } from '../types'
import { APPLIED_EVENT_COLOR, INTERVIEW_EVENT_COLOR } from '../types'

/**
 * User-facing labels used when building calendar event titles.
 *
 * They are injected (rather than imported from i18n) so `buildCalendarEvents`
 * stays a pure function and can be unit-tested without a React/i18n context.
 */
export interface CalendarEventLabels {
  /** Translated label for an interview type, e.g. `Technical`. */
  interviewType: (type: InterviewType) => string
  /** Label for the "applied" event kind. */
  applied: string
  /** Fallback label for missing company/position data. */
  unknown: string
}

/**
 * Builds FullCalendar events from interviews and applications.
 *
 * Interviews are rendered as timed events in the interview's own timezone
 * (falling back to the device timezone); applications are rendered as all-day
 * events on their `appliedAt` date (falling back to `createdAt`).
 *
 * @param interviews - Interviews to render; entries without `scheduledAt` are skipped.
 * @param applications - Applications to render; soft-deleted ones are skipped.
 * @param deviceTimezone - IANA timezone used when an interview has none.
 * @param labels - Translated labels for event titles.
 */
export function buildCalendarEvents(
  interviews: readonly JobApplicationInterview[] | undefined,
  applications: readonly JobApplication[] | undefined,
  deviceTimezone: string,
  labels: CalendarEventLabels
): EventInput[] {
  const appMap = new Map<string, JobApplication>(
    (applications ?? []).map((application) => [application.id, application])
  )

  const events: EventInput[] = []

  for (const interview of interviews ?? []) {
    if (!interview.scheduledAt) continue

    const application = appMap.get(interview.applicationId)
    // Only skip when the application is explicitly soft-deleted (not when it is
    // simply outside the current date-range filter for applications).
    if (application?.deletedAt) continue

    const interviewTimezone = interview.timezone ?? deviceTimezone
    const localStart = dayjs
      .utc(interview.scheduledAt)
      .tz(interviewTimezone)
      .format()

    const props: CalendarEventExtendedProps = {
      kind: 'interview',
      applicationId: interview.applicationId,
      companyName: application?.companyName ?? labels.unknown,
      positionTitle: application?.positionTitle ?? labels.unknown,
      interviewId: interview.id,
      interviewType: interview.type,
      scheduledAt: interview.scheduledAt,
      location: interview.location,
      interviewNotes: interview.notes
    }

    events.push({
      id: `interview-${interview.id}`,
      title: `${labels.interviewType(interview.type)} · ${
        application?.companyName ?? labels.unknown
      }`,
      start: localStart,
      backgroundColor: INTERVIEW_EVENT_COLOR,
      borderColor: INTERVIEW_EVENT_COLOR,
      extendedProps: props
    })
  }

  for (const application of applications ?? []) {
    // appliedAt is populated by the API when appliedFrom/appliedTo/timezone
    // query params are sent. Fall back to createdAt when it is unavailable.
    const appliedDate = application.appliedAt ?? application.createdAt
    if (!appliedDate || application.deletedAt) continue

    const props: CalendarEventExtendedProps = {
      kind: 'applied',
      applicationId: application.id,
      companyName: application.companyName,
      positionTitle: application.positionTitle
    }

    events.push({
      id: `applied-${application.id}`,
      title: `${labels.applied} · ${application.companyName}`,
      start: appliedDate,
      allDay: true,
      backgroundColor: APPLIED_EVENT_COLOR,
      borderColor: APPLIED_EVENT_COLOR,
      extendedProps: props
    })
  }

  return events
}
