import { api } from '@/lib/api.library'

// ── API contract ────────────────────────────────────────────────────────────
//
// Request/response shapes for the interview endpoints, mirroring the NestJS API
// (`X-Api-Version: 1`, cookie-session auth). They are co-located with the
// service so it stays self-contained, following the applications module.

/** Interview types accepted by the API's `interviewTypeEnum`. */
export const INTERVIEW_TYPES = [
  'SCREENING',
  'PHONE',
  'TECHNICAL',
  'FINAL',
  'HR',
  'OTHER'
] as const

/** A single interview type. */
export type InterviewType = (typeof INTERVIEW_TYPES)[number]

/** An interview as returned by the API (dates are ISO strings). */
export interface JobApplicationInterview {
  id: string
  applicationId: string
  type: InterviewType
  scheduledAt: string | null
  timezone: string | null
  location: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

/** Payload accepted by `POST /applications/:id/interviews`. */
export interface CreateInterviewPayload {
  type: InterviewType
  scheduledAt: string
  timezone?: string
  location?: string
  notes?: string
}

/** Payload accepted by `PATCH /applications/:id/interviews/:interviewId`. */
export type UpdateInterviewPayload = Partial<CreateInterviewPayload>

/** Parameters for `GET /interviews` (all of them are required by the API). */
export interface InterviewsInRangeParams {
  /** ISO 8601 start of the range, interpreted in `timezone`. */
  from: string
  /** ISO 8601 end of the range, interpreted in `timezone`. */
  to: string
  /** IANA timezone name used to interpret `from`/`to`. */
  timezone: string
}

/** Parameters for `GET /interviews/upcoming` (all required by the API). */
export interface UpcomingInterviewsParams {
  /** ISO 8601 start datetime, interpreted in `timezone`. */
  from: string
  /** IANA timezone name used to interpret `from`. */
  timezone: string
  /** Maximum number of interviews to return (integer, at least 1). */
  top: number
}

/**
 * InterviewsService
 * Service for reading and managing the interviews attached to job
 * applications. It is the single entry point for the interview endpoints and
 * is meant to be consumed by TanStack Query hooks.
 */
class InterviewsService {
  /**
   * Lists the authenticated user's interviews inside a date range.
   * @param   {InterviewsInRangeParams} params - Range plus the timezone it is expressed in.
   * @returns {Promise<JobApplicationInterview[]>} Interviews ordered by `scheduledAt` ascending.
   */
  fetchInterviewsInRange(
    params: InterviewsInRangeParams
  ): Promise<JobApplicationInterview[]> {
    return api.get<JobApplicationInterview[]>('/interviews', {
      query: {
        from: params.from,
        to: params.to,
        timezone: params.timezone
      }
    })
  }

  /**
   * Lists the nearest upcoming interviews for the authenticated user.
   * @param   {UpcomingInterviewsParams} params - Start datetime, timezone and result limit.
   * @returns {Promise<JobApplicationInterview[]>} Up to `top` interviews, soonest first.
   */
  fetchUpcomingInterviews(
    params: UpcomingInterviewsParams
  ): Promise<JobApplicationInterview[]> {
    return api.get<JobApplicationInterview[]>('/interviews/upcoming', {
      query: {
        from: params.from,
        timezone: params.timezone,
        top: params.top
      }
    })
  }

  /**
   * Lists every interview belonging to a job application.
   * @param   {string} applicationId - The application ID.
   * @returns {Promise<JobApplicationInterview[]>}
   */
  fetchApplicationInterviews(
    applicationId: string
  ): Promise<JobApplicationInterview[]> {
    return api.get<JobApplicationInterview[]>(
      `/applications/${applicationId}/interviews`
    )
  }

  /**
   * Creates an interview for a job application.
   * @param   {string} applicationId - The application ID.
   * @param   {CreateInterviewPayload} payload - The interview data.
   * @returns {Promise<JobApplicationInterview>} The created interview.
   */
  createInterview(
    applicationId: string,
    payload: CreateInterviewPayload
  ): Promise<JobApplicationInterview> {
    return api.post<JobApplicationInterview>(
      `/applications/${applicationId}/interviews`,
      payload
    )
  }

  /**
   * Partially updates an interview.
   * @param   {string} applicationId - The parent application ID.
   * @param   {string} interviewId - The interview ID.
   * @param   {UpdateInterviewPayload} payload - The fields to update.
   * @returns {Promise<JobApplicationInterview>} The updated interview.
   */
  updateInterview(
    applicationId: string,
    interviewId: string,
    payload: UpdateInterviewPayload
  ): Promise<JobApplicationInterview> {
    return api.patch<JobApplicationInterview>(
      `/applications/${applicationId}/interviews/${interviewId}`,
      payload
    )
  }

  /**
   * Deletes an interview.
   * @param   {string} applicationId - The parent application ID.
   * @param   {string} interviewId - The interview ID.
   * @returns {Promise<void>} The API replies with 204 No Content.
   */
  deleteInterview(
    applicationId: string,
    interviewId: string
  ): Promise<void> {
    return api.delete<void>(
      `/applications/${applicationId}/interviews/${interviewId}`
    )
  }
}

export { InterviewsService }

/** Shared instance used by the interview query hooks. */
export const interviewsService = new InterviewsService()
