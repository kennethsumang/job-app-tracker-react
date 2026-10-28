import {
  useApplications,
  type JobApplication
} from '@/features/app/features/applications'
import {
  useInterviewsInRange,
  type InterviewsInRangeParams,
  type JobApplicationInterview
} from '@/features/app/features/interviews'

/** A visible calendar range expressed in ISO strings. */
export interface CalendarRange {
  /** ISO 8601 start of the range. */
  from: string
  /** ISO 8601 end of the range. */
  to: string
}

/** Data required to render the calendar for a given visible range. */
export interface CalendarData {
  interviewsData: JobApplicationInterview[] | undefined
  interviewsLoading: boolean
  applicationsData: JobApplication[] | undefined
  applicationsLoading: boolean
}

/**
 * Fetches the interviews and applications that overlap a calendar range.
 *
 * The interviews endpoint is queried with `from`/`to`/`timezone`; applications
 * are queried with `appliedFrom`/`appliedTo`/`timezone` so the API derives the
 * `appliedAt` date used for all-day "applied" events.
 */
export function useCalendarData(
  range: CalendarRange,
  timezone: string
): CalendarData {
  const interviewsParams: InterviewsInRangeParams = {
    from: range.from,
    to: range.to,
    timezone
  }

  const interviews = useInterviewsInRange(interviewsParams, {
    refetchOnMount: true
  })
  const applications = useApplications(
    {
      appliedFrom: range.from,
      appliedTo: range.to,
      timezone
    },
    { refetchOnMount: true }
  )

  return {
    interviewsData: interviews.data,
    interviewsLoading: interviews.isLoading,
    applicationsData: applications.data?.data,
    applicationsLoading: applications.isLoading
  }
}
