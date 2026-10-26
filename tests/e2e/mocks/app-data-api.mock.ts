import type { Page, Route } from '@playwright/test'
import {
  delay,
  fulfillApiError,
  fulfillEnvelope,
  readJsonBody,
} from './http'

/**
 * In-browser mock of the read-only API endpoints the authenticated shell needs
 * right after a successful sign-in.
 *
 * Without these, the dashboard would render react-query error states and any
 * "lands on the dashboard" assertion would be flaky or meaningless. Only the
 * endpoints the authenticated journeys touch are mocked — extend this module
 * when new journeys need more data.
 *
 * Endpoints covered:
 * - `GET  /api/applications`                → list + count (statuses/search/page/limit)
 * - `POST /api/applications`                → create (recorded, appended to the seed)
 * - `GET  /api/applications/:id`            → single application
 * - `GET  /api/applications/:id/interviews` → interviews of an application
 * - `GET  /api/interviews/upcoming`         → next interviews (`from`, `top`)
 *
 * Responses can be delayed (`setLatency`) and every endpoint can be made to
 * fail (`failApplications`, `failCreateApplication`, `failApplicationDetail`,
 * `failUpcomingInterviews`), so specs can observe loading states and exercise
 * failure paths.
 */

/** Subset of the API `JobApplication` contract used by the fixtures. */
export interface MockApplication {
  id: string
  userId: string
  companyName: string
  positionTitle: string
  status: string
  employmentType: string | null
  workplaceType: string | null
  jobLocation: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

/** Interview types accepted by the API's `interviewTypeEnum`. */
export type MockInterviewType =
  | 'SCREENING'
  | 'PHONE'
  | 'TECHNICAL'
  | 'FINAL'
  | 'HR'
  | 'OTHER'

/** Subset of the API `JobApplicationInterview` contract used by the fixtures. */
export interface MockInterview {
  id: string
  applicationId: string
  type: MockInterviewType
  scheduledAt: string | null
  timezone: string | null
  location: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

const OWNER_ID = 'usr_e2e_verified'
const CREATED_AT = '2025-01-15T08:00:00.000Z'

/**
 * Three applications, two of them in progress (APPLIED + INTERVIEW), so the
 * dashboard summary tiles show `3` and `2`.
 */
export const DEFAULT_APPLICATIONS: readonly MockApplication[] = [
  {
    id: 'app_e2e_1',
    userId: OWNER_ID,
    companyName: 'Acme Corp',
    positionTitle: 'Senior Frontend Engineer',
    status: 'APPLIED',
    employmentType: 'FULL_TIME',
    workplaceType: 'REMOTE',
    jobLocation: 'Remote',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    deletedAt: null,
  },
  {
    id: 'app_e2e_2',
    userId: OWNER_ID,
    companyName: 'Globex',
    positionTitle: 'Staff Engineer',
    status: 'INTERVIEW',
    employmentType: 'FULL_TIME',
    workplaceType: 'HYBRID',
    jobLocation: 'Manila, PH',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    deletedAt: null,
  },
  {
    id: 'app_e2e_3',
    userId: OWNER_ID,
    companyName: 'Initech',
    positionTitle: 'Platform Engineer',
    status: 'REJECTED',
    employmentType: 'CONTRACT',
    workplaceType: 'ONSITE',
    jobLocation: 'Austin, TX',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    deletedAt: null,
  },
]

export interface AppDataApiMockOptions {
  applications?: readonly MockApplication[]
  interviews?: readonly MockInterview[]
  /** Artificial latency for every response, to observe loading states. */
  latencyMs?: number
}

/** Expected dashboard counters derived from the seeded applications. */
export interface DashboardCounts {
  total: number
  inProgress: number
}

/** Statuses the dashboard treats as "in progress" (see `use-dashboard.ts`). */
export const IN_PROGRESS_STATUSES = [
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'TECHNICAL_INTERVIEW',
  'FINAL_INTERVIEW',
  'OFFER',
] as const

const IN_PROGRESS_STATUS_SET = new Set<string>(IN_PROGRESS_STATUSES)

/**
 * One upcoming interview, attached to the `INTERVIEW` application (Globex), so
 * the dashboard renders its next-interview card.
 *
 * The schedule is computed per run because the dashboard asks for interviews
 * starting "now": a hard-coded date would eventually be in the past and the
 * card would silently disappear.
 */
export const UPCOMING_INTERVIEW_AT = new Date(
  Date.now() + 2 * 24 * 60 * 60 * 1000,
).toISOString()

export const DEFAULT_UPCOMING_INTERVIEWS: readonly MockInterview[] = [
  {
    id: 'int_e2e_1',
    applicationId: 'app_e2e_2',
    type: 'TECHNICAL',
    scheduledAt: UPCOMING_INTERVIEW_AT,
    timezone: 'UTC',
    location: 'Google Meet',
    notes: null,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  },
]

/**
 * Builds an application on top of the fixture defaults.
 *
 * @param overrides - Fields to replace; `id` is required.
 * @returns A complete `MockApplication`.
 */
export function buildApplication(
  overrides: Partial<MockApplication> & Pick<MockApplication, 'id'>,
): MockApplication {
  return {
    userId: OWNER_ID,
    companyName: 'Example Co',
    positionTitle: 'Software Engineer',
    status: 'APPLIED',
    employmentType: 'FULL_TIME',
    workplaceType: 'REMOTE',
    jobLocation: 'Remote',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    deletedAt: null,
    ...overrides,
  }
}

/** Failure the mock returns instead of endpoint data. */
export type AppDataFailure =
  | { status: number; message: string }
  | 'network-error'

/** A `GET /api/applications` list/count request seen by the mock. */
export interface RecordedApplicationListRequest {
  page: number
  limit: number
  /** Values of the repeated `statuses` query key. */
  statuses: string[]
  search: string
}

/** A `GET /api/interviews/upcoming` request seen by the mock. */
export interface RecordedUpcomingInterviewsRequest {
  from: string
  top: number
  timezone: string
}

/** Body of `POST /api/applications` as sent by the client. */
export interface MockCreateApplicationPayload {
  companyName: string
  positionTitle: string
  status?: string
  employmentType?: string
  workplaceType?: string
  jobLocation?: string
}

export class AppDataApiMock {
  private readonly page: Page
  private applicationsData: readonly MockApplication[]
  private interviewsData: readonly MockInterview[]
  private latencyMs: number
  private applicationsFailure: AppDataFailure | null = null
  private createApplicationFailure: AppDataFailure | null = null
  private applicationDetailFailure: AppDataFailure | null = null
  private upcomingInterviewsFailure: AppDataFailure | null = null

  /** Every list/count request the mock served, in order. */
  readonly applicationListRequests: RecordedApplicationListRequest[] = []

  /** Every create request the mock received, in order. */
  readonly createRequests: MockCreateApplicationPayload[] = []

  /** Every upcoming-interviews request the mock served, in order. */
  readonly upcomingInterviewRequests: RecordedUpcomingInterviewsRequest[] = []

  constructor(page: Page, options: AppDataApiMockOptions = {}) {
    this.page = page
    this.applicationsData = options.applications ?? DEFAULT_APPLICATIONS
    this.interviewsData = options.interviews ?? DEFAULT_UPCOMING_INTERVIEWS
    this.latencyMs = options.latencyMs ?? 0
  }

  /** Applications currently seeded in the mock. */
  get applications(): readonly MockApplication[] {
    return this.applicationsData
  }

  /** Interviews currently seeded in the mock. */
  get interviews(): readonly MockInterview[] {
    return this.interviewsData
  }

  /** Counters the UI should display for the seeded data. */
  get dashboardCounts(): DashboardCounts {
    return {
      total: this.applicationsData.length,
      inProgress: this.applicationsData.filter((application) =>
        IN_PROGRESS_STATUS_SET.has(application.status),
      ).length,
    }
  }

  /** Registers the route handlers. Must run before the first navigation. */
  async install(): Promise<void> {
    await this.page.route('**/api/applications**', (route) =>
      this.handleApplications(route),
    )
    await this.page.route('**/api/interviews**', (route) =>
      this.handleInterviews(route),
    )
  }

  /** Replaces the seeded applications. Call before navigating. */
  setApplications(applications: readonly MockApplication[]): void {
    this.applicationsData = applications
  }

  /** Replaces the seeded interviews; pass `[]` to hide the dashboard card. */
  setUpcomingInterviews(interviews: readonly MockInterview[]): void {
    this.interviewsData = interviews
  }

  /** Adds latency to every response so loading states stay observable. */
  setLatency(latencyMs: number): void {
    this.latencyMs = latencyMs
  }

  /** Makes every `/api/applications` list/count request fail. */
  failApplications(failure: AppDataFailure): void {
    this.applicationsFailure = failure
  }

  /** Makes every `POST /api/applications` request fail. */
  failCreateApplication(failure: AppDataFailure): void {
    this.createApplicationFailure = failure
  }

  /** Makes every `/api/applications/:id` request fail. */
  failApplicationDetail(failure: AppDataFailure): void {
    this.applicationDetailFailure = failure
  }

  /** Makes every `GET /api/interviews/upcoming` request fail. */
  failUpcomingInterviews(failure: AppDataFailure): void {
    this.upcomingInterviewsFailure = failure
  }

  /** Clears every injected failure, letting the mock serve data again. */
  clearFailures(): void {
    this.applicationsFailure = null
    this.createApplicationFailure = null
    this.applicationDetailFailure = null
    this.upcomingInterviewsFailure = null
  }

  private async handleApplications(route: Route): Promise<void> {
    const method = route.request().method()
    const url = new URL(route.request().url())
    const segments = url.pathname.split('/').filter(Boolean)

    if (method === 'POST') {
      await this.handleCreate(route)
      return
    }

    if (method !== 'GET') {
      await fulfillApiError(
        route,
        501,
        `No applications mock registered for ${method} ${url.pathname}`,
      )
      return
    }

    await this.wait()

    // `/api/applications/:id/interviews`
    if (segments.length === 4 && segments[3] === 'interviews') {
      const interviews = this.interviewsData.filter(
        (interview) => interview.applicationId === segments[2],
      )
      await fulfillEnvelope(route, interviews)
      return
    }

    // `/api/applications/:id`
    if (segments.length === 3) {
      if (this.applicationDetailFailure) {
        await this.respondWithFailure(route, this.applicationDetailFailure)
        return
      }

      const application = this.applicationsData.find(
        (candidate) => candidate.id === segments[2],
      )

      if (!application) {
        await fulfillApiError(route, 404, 'Application not found')
        return
      }

      await fulfillEnvelope(route, application)
      return
    }

    // `/api/applications` (list + count, used by the dashboard tiles)
    const statuses = url.searchParams.getAll('statuses')
    const search = url.searchParams.get('search')?.toLowerCase() ?? ''
    const page = Number(url.searchParams.get('page') ?? 1)
    const limit = Number(url.searchParams.get('limit') ?? 10)

    this.applicationListRequests.push({ page, limit, statuses, search })

    if (this.applicationsFailure) {
      await this.respondWithFailure(route, this.applicationsFailure)
      return
    }

    const filtered = this.applicationsData.filter((application) => {
      const matchesStatus =
        statuses.length === 0 || statuses.includes(application.status)
      const matchesSearch =
        search.length === 0 ||
        application.companyName.toLowerCase().includes(search) ||
        application.positionTitle.toLowerCase().includes(search)

      return matchesStatus && matchesSearch
    })

    const start = Math.max(page - 1, 0) * limit
    const items = filtered.slice(start, start + limit)

    await fulfillEnvelope(route, { data: items, count: filtered.length })
  }

  /**
   * Handles `POST /api/applications`.
   *
   * The payload is recorded before the (optional) failure is injected, so specs
   * can assert what the form sent even when the request fails. Successful
   * creates are appended to the seeded applications, which makes the dashboard
   * counters change exactly like they would against the real API.
   */
  private async handleCreate(route: Route): Promise<void> {
    const payload = readJsonBody<MockCreateApplicationPayload>(route)
    this.createRequests.push(payload)

    await this.wait()

    if (this.createApplicationFailure) {
      await this.respondWithFailure(route, this.createApplicationFailure)
      return
    }

    const now = new Date().toISOString()
    const created: MockApplication = {
      id: `app_e2e_created_${this.createRequests.length}`,
      userId: OWNER_ID,
      companyName: payload.companyName,
      positionTitle: payload.positionTitle,
      status: payload.status ?? 'DRAFT',
      employmentType: payload.employmentType ?? null,
      workplaceType: payload.workplaceType ?? null,
      jobLocation: payload.jobLocation ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }

    this.applicationsData = [...this.applicationsData, created]

    await fulfillEnvelope(route, created, 201)
  }

  private async handleInterviews(route: Route): Promise<void> {
    const url = new URL(route.request().url())

    await this.wait()

    // `GET /api/interviews/upcoming` — the dashboard's next-interview card.
    if (url.pathname.endsWith('/interviews/upcoming')) {
      const from = url.searchParams.get('from') ?? ''
      const top = Number(url.searchParams.get('top') ?? 1)
      const timezone = url.searchParams.get('timezone') ?? ''

      this.upcomingInterviewRequests.push({ from, top, timezone })

      if (this.upcomingInterviewsFailure) {
        await this.respondWithFailure(route, this.upcomingInterviewsFailure)
        return
      }

      const fromTime = Date.parse(from)
      const upcoming = this.interviewsData
        .filter(
          (interview): interview is MockInterview & { scheduledAt: string } =>
            interview.scheduledAt !== null,
        )
        .filter((interview) => Date.parse(interview.scheduledAt) >= fromTime)
        .sort(
          (left, right) =>
            Date.parse(left.scheduledAt) - Date.parse(right.scheduledAt),
        )
        .slice(0, top)

      await fulfillEnvelope(route, upcoming)
      return
    }

    // Any other interviews read (e.g. a calendar range) has no seeded data.
    await fulfillEnvelope(route, [])
  }

  private async respondWithFailure(
    route: Route,
    failure: AppDataFailure,
  ): Promise<void> {
    if (failure === 'network-error') {
      await route.abort('connectionrefused')
      return
    }

    await fulfillApiError(route, failure.status, failure.message)
  }

  private async wait(): Promise<void> {
    if (this.latencyMs > 0) {
      await delay(this.latencyMs)
    }
  }
}
