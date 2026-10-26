import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions
} from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
  interviewsService,
  type CreateInterviewPayload,
  type InterviewsInRangeParams,
  type JobApplicationInterview,
  type UpcomingInterviewsParams,
  type UpdateInterviewPayload
} from '@/features/app/features/interviews/services/interviews.service'
import { getDeviceTimezone } from '@/lib/device-settings'

/**
 * Cache keys for the interviews domain.
 *
 * Every interview query lives under the `["interviews"]` prefix, so a single
 * invalidation refreshes ranges, upcoming interviews and per-application lists
 * after a mutation.
 */
export const interviewsKeys = {
  all: ['interviews'] as const,
  lists: () => [...interviewsKeys.all, 'list'] as const,
  inRange: (params: InterviewsInRangeParams) =>
    [...interviewsKeys.lists(), 'range', params] as const,
  upcoming: (params: UpcomingInterviewsParams) =>
    [...interviewsKeys.lists(), 'upcoming', params] as const,
  application: (applicationId: string) =>
    [...interviewsKeys.all, 'application', applicationId] as const
}

/** Extra TanStack Query options accepted by the interview query hooks. */
type InterviewsQueryOptions<T> = Omit<
  UseQueryOptions<T>,
  'queryKey' | 'queryFn'
>

/** How long an upcoming-interview result stays fresh (milliseconds). */
const UPCOMING_INTERVIEW_STALE_TIME_MS = 30_000

/** Fetches the user's interviews inside a date range. */
export function useInterviewsInRange(
  params: InterviewsInRangeParams,
  options?: InterviewsQueryOptions<JobApplicationInterview[]>
) {
  return useQuery<JobApplicationInterview[]>({
    queryKey: interviewsKeys.inRange(params),
    queryFn: () => interviewsService.fetchInterviewsInRange(params),
    enabled: Boolean(params.from && params.to && params.timezone),
    ...options
  })
}

/** Fetches the nearest upcoming interviews, soonest first. */
export function useUpcomingInterviews(
  params: UpcomingInterviewsParams,
  options?: InterviewsQueryOptions<JobApplicationInterview[]>
) {
  return useQuery<JobApplicationInterview[]>({
    queryKey: interviewsKeys.upcoming(params),
    queryFn: () => interviewsService.fetchUpcomingInterviews(params),
    enabled: Boolean(params.from && params.timezone && params.top > 0),
    ...options
  })
}

/**
 * Fetches the user's next scheduled interview (or `null` when there is none).
 *
 * `from` is truncated to minute precision so the query key stays stable across
 * renders instead of busting the 30-second `staleTime` on every render.
 */
export function useUpcomingInterview(
  options?: InterviewsQueryOptions<JobApplicationInterview | null>
) {
  const params: UpcomingInterviewsParams = {
    from: dayjs().startOf('minute').toISOString(),
    timezone: getDeviceTimezone(),
    top: 1
  }

  return useQuery<JobApplicationInterview | null>({
    queryKey: interviewsKeys.upcoming(params),
    queryFn: () =>
      interviewsService
        .fetchUpcomingInterviews(params)
        .then((interviews) => interviews[0] ?? null),
    staleTime: UPCOMING_INTERVIEW_STALE_TIME_MS,
    ...options
  })
}

/** Fetches every interview belonging to a job application. */
export function useApplicationInterviews(
  applicationId: string,
  options?: InterviewsQueryOptions<JobApplicationInterview[]>
) {
  return useQuery<JobApplicationInterview[]>({
    queryKey: interviewsKeys.application(applicationId),
    queryFn: () => interviewsService.fetchApplicationInterviews(applicationId),
    enabled: Boolean(applicationId),
    ...options
  })
}

/** Variables accepted by {@link useCreateInterview}. */
export interface CreateInterviewVariables {
  applicationId: string
  payload: CreateInterviewPayload
}

/** Creates an interview and invalidates the interviews cache. */
export function useCreateInterview() {
  const queryClient = useQueryClient()

  return useMutation<
    JobApplicationInterview,
    Error,
    CreateInterviewVariables
  >({
    mutationFn: ({ applicationId, payload }) =>
      interviewsService.createInterview(applicationId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: interviewsKeys.all })
    },
    throwOnError: false
  })
}

/** Variables accepted by {@link useUpdateInterview}. */
export interface UpdateInterviewVariables {
  applicationId: string
  interviewId: string
  payload: UpdateInterviewPayload
}

/** Partially updates an interview and invalidates the interviews cache. */
export function useUpdateInterview() {
  const queryClient = useQueryClient()

  return useMutation<
    JobApplicationInterview,
    Error,
    UpdateInterviewVariables
  >({
    mutationFn: ({ applicationId, interviewId, payload }) =>
      interviewsService.updateInterview(applicationId, interviewId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: interviewsKeys.all })
    },
    throwOnError: false
  })
}

/** Variables accepted by {@link useDeleteInterview}. */
export interface DeleteInterviewVariables {
  applicationId: string
  interviewId: string
}

/** Deletes an interview and invalidates the interviews cache. */
export function useDeleteInterview() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, DeleteInterviewVariables>({
    mutationFn: ({ applicationId, interviewId }) =>
      interviewsService.deleteInterview(applicationId, interviewId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: interviewsKeys.all })
    },
    throwOnError: false
  })
}
