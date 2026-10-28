import type { InterviewType } from '@/features/app/features/interviews'

// ── Event types for the calendar ────────────────────────────────────────────

/** Kind of a calendar event. */
export type CalendarEventKind = 'interview' | 'applied'

/** Extra data attached to every FullCalendar event. */
export interface CalendarEventExtendedProps {
  kind: CalendarEventKind
  applicationId: string
  companyName: string
  positionTitle: string
  interviewId?: string
  interviewType?: InterviewType
  scheduledAt?: string | null
  location?: string | null
  interviewNotes?: string | null
}

// ── Utility colors ───────────────────────────────────────────────────────────

export const INTERVIEW_EVENT_COLOR = '#f57c00'
export const APPLIED_EVENT_COLOR = '#1976d2'
