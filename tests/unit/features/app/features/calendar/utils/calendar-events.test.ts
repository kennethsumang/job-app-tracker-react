import type { JobApplication } from '@/features/app/features/applications'
import type {
  CalendarEventExtendedProps
} from '@/features/app/features/calendar/types'
import {
  APPLIED_EVENT_COLOR,
  INTERVIEW_EVENT_COLOR
} from '@/features/app/features/calendar/types'
import {
  buildCalendarEvents,
  type CalendarEventLabels
} from '@/features/app/features/calendar/utils/calendar-events'
import type { JobApplicationInterview } from '@/features/app/features/interviews'
import dayjs from '@/lib/dayjs'

const labels: CalendarEventLabels = {
  interviewType: (type) => `Type:${type}`,
  applied: 'Applied',
  unknown: 'Unknown'
}

function buildApplication(
  overrides: Partial<JobApplication> & Pick<JobApplication, 'id'>
): JobApplication {
  return {
    userId: 'user-1',
    companyName: 'Acme Corp',
    companyWebsite: null,
    positionTitle: 'Software Engineer',
    jobLocation: null,
    employmentType: null,
    workplaceType: null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    status: 'APPLIED',
    appliedAt: null,
    lastContactedAt: null,
    offerDeadline: null,
    rejectedAt: null,
    recruiterName: null,
    recruiterEmail: null,
    recruiterPhone: null,
    jobPostingUrl: null,
    coverLetterUrl: null,
    source: null,
    notes: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    ...overrides
  }
}

function buildInterview(
  overrides: Partial<JobApplicationInterview> &
    Pick<JobApplicationInterview, 'id'>
): JobApplicationInterview {
  return {
    applicationId: 'app-1',
    type: 'TECHNICAL',
    scheduledAt: '2026-01-05T10:00:00.000Z',
    timezone: null,
    location: null,
    notes: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  }
}

describe('buildCalendarEvents', () => {
  it('builds a timed interview event', () => {
    const interview = buildInterview({
      id: 'int-1',
      applicationId: 'app-1',
      type: 'TECHNICAL',
      scheduledAt: '2026-01-05T10:00:00.000Z',
      timezone: 'UTC'
    })
    const application = buildApplication({
      id: 'app-1',
      companyName: 'Globex',
      positionTitle: 'Staff Engineer'
    })

    const events = buildCalendarEvents([interview], [application], 'UTC', labels)

    const event = events.find((candidate) => candidate.id === 'interview-int-1')
    expect(event).toBeDefined()
    expect(event?.title).toBe('Type:TECHNICAL · Globex')
    expect(dayjs(event?.start as string).toISOString()).toBe(
      '2026-01-05T10:00:00.000Z'
    )
    expect(event?.backgroundColor).toBe(INTERVIEW_EVENT_COLOR)
    expect(event?.borderColor).toBe(INTERVIEW_EVENT_COLOR)
    expect(event?.extendedProps).toEqual({
      kind: 'interview',
      applicationId: 'app-1',
      companyName: 'Globex',
      positionTitle: 'Staff Engineer',
      interviewId: 'int-1',
      interviewType: 'TECHNICAL',
      scheduledAt: '2026-01-05T10:00:00.000Z',
      location: null,
      interviewNotes: null
    })
  })

  it('skips interviews without a scheduled time', () => {
    const interview = buildInterview({ id: 'int-1', scheduledAt: null })

    const events = buildCalendarEvents([interview], [], 'UTC', labels)

    expect(events).toHaveLength(0)
  })

  it('skips interviews whose application is soft-deleted', () => {
    const interview = buildInterview({ id: 'int-1', applicationId: 'app-1' })
    const application = buildApplication({
      id: 'app-1',
      deletedAt: '2026-01-02T00:00:00.000Z'
    })

    const events = buildCalendarEvents([interview], [application], 'UTC', labels)

    expect(events).toHaveLength(0)
  })

  it('falls back to Unknown when the interview application is missing', () => {
    const interview = buildInterview({
      id: 'int-1',
      applicationId: 'missing'
    })

    const events = buildCalendarEvents([interview], [], 'UTC', labels)

    expect(events).toHaveLength(1)
    expect(events[0].title).toBe('Type:TECHNICAL · Unknown')
    expect(
      (events[0].extendedProps as CalendarEventExtendedProps).companyName
    ).toBe('Unknown')
    expect(
      (events[0].extendedProps as CalendarEventExtendedProps).positionTitle
    ).toBe('Unknown')
  })

  it('converts the interview start into the interview timezone', () => {
    const interview = buildInterview({
      id: 'int-1',
      scheduledAt: '2026-01-05T15:00:00.000Z',
      timezone: 'America/New_York'
    })

    const events = buildCalendarEvents(
      [interview],
      [buildApplication({ id: 'app-1' })],
      'UTC',
      labels
    )

    expect(events[0].start).toBe('2026-01-05T10:00:00-05:00')
    expect(dayjs(events[0].start as string).toISOString()).toBe(
      '2026-01-05T15:00:00.000Z'
    )
  })

  it('builds an all-day applied event using appliedAt', () => {
    const application = buildApplication({
      id: 'app-1',
      companyName: 'Globex',
      appliedAt: '2026-01-10T00:00:00.000Z'
    })

    const events = buildCalendarEvents([], [application], 'UTC', labels)

    expect(events).toHaveLength(1)
    const event = events[0]
    expect(event.id).toBe('applied-app-1')
    expect(event.title).toBe('Applied · Globex')
    expect(event.start).toBe('2026-01-10T00:00:00.000Z')
    expect(event.allDay).toBe(true)
    expect(event.backgroundColor).toBe(APPLIED_EVENT_COLOR)
    expect(event.extendedProps).toEqual({
      kind: 'applied',
      applicationId: 'app-1',
      companyName: 'Globex',
      positionTitle: 'Software Engineer'
    })
  })

  it('falls back to createdAt for applied events', () => {
    const application = buildApplication({
      id: 'app-1',
      appliedAt: null,
      createdAt: '2026-02-01T00:00:00.000Z'
    })

    const events = buildCalendarEvents([], [application], 'UTC', labels)

    expect(events).toHaveLength(1)
    expect(events[0].start).toBe('2026-02-01T00:00:00.000Z')
  })

  it('skips soft-deleted applications for applied events', () => {
    const application = buildApplication({
      id: 'app-1',
      deletedAt: '2026-02-01T00:00:00.000Z'
    })

    const events = buildCalendarEvents([], [application], 'UTC', labels)

    expect(events).toHaveLength(0)
  })

  it('handles undefined inputs', () => {
    expect(buildCalendarEvents(undefined, undefined, 'UTC', labels)).toEqual([])
  })
})
