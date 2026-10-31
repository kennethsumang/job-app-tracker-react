import type { Page, Route } from '@playwright/test'
import {
  delay,
  fulfillApiError,
  fulfillEnvelope,
  readJsonBody,
} from './http'

/**
 * In-browser mock of the API endpoints the authenticated shell needs.
 *
 * Without these, the dashboard would render react-query error states and any
 * "lands on the dashboard" assertion would be flaky or meaningless. Only the
 * endpoints the authenticated journeys touch are mocked — extend this module
 * when new journeys need more data.
 *
 * Endpoints covered:
 * - `GET    /api/applications`              → list + count (statuses/search/showDeleted/page/limit)
 * - `POST   /api/applications`              → create (recorded, appended to the seed)
 * - `PATCH  /api/applications/:id`          → update (recorded, applied to the seed)
 * - `DELETE /api/applications/:id`          → soft-delete (recorded, sets deletedAt)
 * - `PATCH  /api/applications/:id/status`   → status change (recorded, applied)
 * - `POST   /api/applications/:id/restore`  → restore (clears deletedAt)
 * - `POST   /api/applications/:id/interviews`            → create interview
 * - `PATCH  /api/applications/:id/interviews/:interviewId` → update interview
 * - `DELETE /api/applications/:id/interviews/:interviewId` → delete interview (204)
 * - `GET    /api/applications/:id`          → single application
 * - `GET    /api/applications/:id/interviews` → interviews of an application
 * - `GET    /api/applications/:id/notes`    → notes (list)
 * - `POST   /api/applications/:id/notes`    → create a note
 * - `PATCH  /api/applications/:id/notes/:noteId` → update a note
 * - `DELETE /api/applications/:id/notes/:noteId` → delete a note (204)
 * - `GET    /api/applications/:id/status-changelogs` → empty status history
 * - `GET    /api/interviews/upcoming`       → next interviews (`from`, `top`)
 * - `GET    /api/interviews`                → calendar range (`from`, `to`, `timezone`)
 *
 * Responses can be delayed (`setLatency`) and every endpoint can be made to
 * fail (`failApplications`, `failCreateApplication`, `failUpdateApplication`,
 * `failDeleteApplication`, `failStatusChange`, `failCreateInterview`,
 * `failUpdateInterview`, `failDeleteInterview`, `failApplicationDetail`,
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
  appliedAt?: string | null
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

/** Subset of the API `ApplicationNote` contract used by the fixtures. */
export interface MockApplicationNote {
  id: string
  applicationId: string
  content: string
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
  notes?: readonly MockApplicationNote[]
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
 * Three notes on the Globex application (newest first), with distinct creation
 * dates so specs can assert ascending/descending ordering.
 */
export const DEFAULT_NOTES: readonly MockApplicationNote[] = [
  {
    id: 'note_e2e_1',
    applicationId: 'app_e2e_2',
    content: 'Initial screening scheduled for next week.',
    createdAt: '2025-02-01T09:00:00.000Z',
    updatedAt: '2025-02-01T09:00:00.000Z',
  },
  {
    id: 'note_e2e_2',
    applicationId: 'app_e2e_2',
    content: 'Recruiter asked for salary expectations.',
    createdAt: '2025-06-01T12:00:00.000Z',
    updatedAt: '2025-06-01T12:00:00.000Z',
  },
  {
    id: 'note_e2e_3',
    applicationId: 'app_e2e_2',
    content: 'Prepare two system design examples.',
    createdAt: '2025-10-01T18:30:00.000Z',
    updatedAt: '2025-10-01T18:30:00.000Z',
  },
] as const

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
    appliedAt: null,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    deletedAt: null,
    ...overrides,
  }
}

/**
 * Builds an interview on top of the fixture defaults.
 *
 * @param overrides - Fields to replace; `id` is required.
 * @returns A complete `MockInterview`.
 */
export function buildInterview(
  overrides: Partial<MockInterview> & Pick<MockInterview, 'id'>,
): MockInterview {
  return {
    applicationId: 'app_e2e_2',
    type: 'TECHNICAL',
    scheduledAt: null,
    timezone: 'UTC',
    location: null,
    notes: null,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    ...overrides,
  }
}

/**
 * Builds an application note on top of the fixture defaults.
 *
 * @param overrides - Fields to replace; `id` is required.
 * @returns A complete `MockApplicationNote`.
 */
export function buildNote(
  overrides: Partial<MockApplicationNote> & Pick<MockApplicationNote, 'id'>,
): MockApplicationNote {
  return {
    applicationId: 'app_e2e_2',
    content: 'Note',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
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
  /** Whether soft-deleted applications were requested. */
  showDeleted: boolean
}

/** A `GET /api/interviews/upcoming` request seen by the mock. */
export interface RecordedUpcomingInterviewsRequest {
  from: string
  top: number
  timezone: string
}

/** A `GET /api/interviews` request seen by the mock. */
export interface RecordedInterviewsRangeRequest {
  from: string
  to: string
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

/** Body of `PATCH /api/applications/:id` as sent by the client. */
export interface MockUpdateApplicationPayload {
  companyName?: string
  positionTitle?: string
  status?: string
  employmentType?: string
  workplaceType?: string
  jobLocation?: string
  companyWebsite?: string
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string
  notes?: string
}

/** A `PATCH /api/applications/:id` request seen by the mock. */
export interface RecordedUpdateApplicationRequest {
  id: string
  payload: MockUpdateApplicationPayload
}

/** A `DELETE /api/applications/:id` request seen by the mock. */
export interface RecordedDeleteApplicationRequest {
  id: string
}

/** Body of `PATCH /api/applications/:id/status` as sent by the client. */
export interface MockUpdateStatusPayload {
  status: string
  changedAt?: string
}

/** A `PATCH /api/applications/:id/status` request seen by the mock. */
export interface RecordedStatusChangeRequest {
  id: string
  payload: MockUpdateStatusPayload
}

/** Body of `POST /api/applications/:id/interviews` as sent by the client. */
export interface MockCreateInterviewPayload {
  type: string
  scheduledAt: string
  timezone?: string
  location?: string
  notes?: string
}

/** A `POST /api/applications/:id/interviews` request seen by the mock. */
export interface RecordedCreateInterviewRequest {
  applicationId: string
  payload: MockCreateInterviewPayload
}

/** A `PATCH /api/applications/:id/interviews/:interviewId` request. */
export interface RecordedUpdateInterviewRequest {
  applicationId: string
  interviewId: string
  payload: Partial<MockCreateInterviewPayload>
}

/** A `DELETE /api/applications/:id/interviews/:interviewId` request. */
export interface RecordedDeleteInterviewRequest {
  applicationId: string
  interviewId: string
}

/** Body of `POST /api/applications/:id/notes`. */
export interface MockCreateNotePayload {
  content: string
}

/** Body of `PATCH /api/applications/:id/notes/:noteId`. */
export type MockUpdateNotePayload = Partial<MockCreateNotePayload>

/** A create-note request seen by the mock. */
export interface RecordedCreateNoteRequest {
  applicationId: string
  payload: MockCreateNotePayload
}

/** An update-note request seen by the mock. */
export interface RecordedUpdateNoteRequest {
  applicationId: string
  noteId: string
  payload: MockUpdateNotePayload
}

/** A delete-note request seen by the mock. */
export interface RecordedDeleteNoteRequest {
  applicationId: string
  noteId: string
}

export class AppDataApiMock {
  private readonly page: Page
  private applicationsData: readonly MockApplication[]
  private interviewsData: readonly MockInterview[]
  private notesData: readonly MockApplicationNote[]
  private latencyMs: number
  private applicationsFailure: AppDataFailure | null = null
  private createApplicationFailure: AppDataFailure | null = null
  private updateApplicationFailure: AppDataFailure | null = null
  private deleteApplicationFailure: AppDataFailure | null = null
  private statusChangeFailure: AppDataFailure | null = null
  private createInterviewFailure: AppDataFailure | null = null
  private updateInterviewFailure: AppDataFailure | null = null
  private deleteInterviewFailure: AppDataFailure | null = null
  private applicationDetailFailure: AppDataFailure | null = null
  private upcomingInterviewsFailure: AppDataFailure | null = null
  private notesFailure: AppDataFailure | null = null
  private createNoteFailure: AppDataFailure | null = null
  private updateNoteFailure: AppDataFailure | null = null
  private deleteNoteFailure: AppDataFailure | null = null

  /** Every list/count request the mock served, in order. */
  readonly applicationListRequests: RecordedApplicationListRequest[] = []

  /** Every create request the mock received, in order. */
  readonly createRequests: MockCreateApplicationPayload[] = []

  /** Every update request the mock received, in order. */
  readonly updateRequests: RecordedUpdateApplicationRequest[] = []

  /** Every delete request the mock received, in order. */
  readonly deleteRequests: RecordedDeleteApplicationRequest[] = []

  /** Every status-change request the mock received, in order. */
  readonly statusChangeRequests: RecordedStatusChangeRequest[] = []

  /** Every interview-create request the mock received, in order. */
  readonly createInterviewRequests: RecordedCreateInterviewRequest[] = []

  /** Every interview-update request the mock received, in order. */
  readonly updateInterviewRequests: RecordedUpdateInterviewRequest[] = []

  /** Every interview-delete request the mock received, in order. */
  readonly deleteInterviewRequests: RecordedDeleteInterviewRequest[] = []

  /** Every upcoming-interviews request the mock served, in order. */
  readonly upcomingInterviewRequests: RecordedUpcomingInterviewsRequest[] = []

  /** Every calendar-range interviews request the mock served, in order. */
  readonly interviewRangeRequests: RecordedInterviewsRangeRequest[] = []

  /** Every create-note request the mock received, in order. */
  readonly createNoteRequests: RecordedCreateNoteRequest[] = []

  /** Every update-note request the mock received, in order. */
  readonly updateNoteRequests: RecordedUpdateNoteRequest[] = []

  /** Every delete-note request the mock received, in order. */
  readonly deleteNoteRequests: RecordedDeleteNoteRequest[] = []

  constructor(page: Page, options: AppDataApiMockOptions = {}) {
    this.page = page
    this.applicationsData = options.applications ?? DEFAULT_APPLICATIONS
    this.interviewsData = options.interviews ?? DEFAULT_UPCOMING_INTERVIEWS
    this.notesData = options.notes ?? DEFAULT_NOTES
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

  /** Application notes currently seeded in the mock. */
  get notes(): readonly MockApplicationNote[] {
    return this.notesData
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

  /** Replaces the seeded interviews used by calendar ranges. */
  setInterviews(interviews: readonly MockInterview[]): void {
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

  /** Makes every `PATCH /api/applications/:id` request fail. */
  failUpdateApplication(failure: AppDataFailure): void {
    this.updateApplicationFailure = failure
  }

  /** Makes every `DELETE /api/applications/:id` request fail. */
  failDeleteApplication(failure: AppDataFailure): void {
    this.deleteApplicationFailure = failure
  }

  /** Makes every `PATCH /api/applications/:id/status` request fail. */
  failStatusChange(failure: AppDataFailure): void {
    this.statusChangeFailure = failure
  }

  /** Makes every `POST /api/applications/:id/interviews` request fail. */
  failCreateInterview(failure: AppDataFailure): void {
    this.createInterviewFailure = failure
  }

  /** Makes every `PATCH /api/applications/:id/interviews/:interviewId` fail. */
  failUpdateInterview(failure: AppDataFailure): void {
    this.updateInterviewFailure = failure
  }

  /** Makes every `DELETE /api/applications/:id/interviews/:interviewId` fail. */
  failDeleteInterview(failure: AppDataFailure): void {
    this.deleteInterviewFailure = failure
  }

  /** Makes every `/api/applications/:id` request fail. */
  failApplicationDetail(failure: AppDataFailure): void {
    this.applicationDetailFailure = failure
  }

  /** Makes every `GET /api/interviews/upcoming` request fail. */
  failUpcomingInterviews(failure: AppDataFailure): void {
    this.upcomingInterviewsFailure = failure
  }

  /** Replaces the seeded notes. Call before navigating. */
  setNotes(notes: readonly MockApplicationNote[]): void {
    this.notesData = notes
  }

  /** Makes every `GET /api/applications/:id/notes` request fail. */
  failNotes(failure: AppDataFailure): void {
    this.notesFailure = failure
  }

  /** Makes every `POST /api/applications/:id/notes` request fail. */
  failCreateNote(failure: AppDataFailure): void {
    this.createNoteFailure = failure
  }

  /** Makes every `PATCH /api/applications/:id/notes/:noteId` request fail. */
  failUpdateNote(failure: AppDataFailure): void {
    this.updateNoteFailure = failure
  }

  /** Makes every `DELETE /api/applications/:id/notes/:noteId` request fail. */
  failDeleteNote(failure: AppDataFailure): void {
    this.deleteNoteFailure = failure
  }

  /** Clears every injected failure, letting the mock serve data again. */
  clearFailures(): void {
    this.applicationsFailure = null
    this.createApplicationFailure = null
    this.updateApplicationFailure = null
    this.deleteApplicationFailure = null
    this.statusChangeFailure = null
    this.createInterviewFailure = null
    this.updateInterviewFailure = null
    this.deleteInterviewFailure = null
    this.applicationDetailFailure = null
    this.upcomingInterviewsFailure = null
    this.notesFailure = null
    this.createNoteFailure = null
    this.updateNoteFailure = null
    this.deleteNoteFailure = null
  }

  private async handleApplications(route: Route): Promise<void> {
    const method = route.request().method()
    const url = new URL(route.request().url())
    const segments = url.pathname.split('/').filter(Boolean)

    // `/api/applications/:id/notes` and `/api/applications/:id/notes/:noteId`.
    // This must run before the generic POST branch below, which would
    // otherwise treat a note creation as an application creation.
    if (segments.length >= 4 && segments[3] === 'notes') {
      await this.handleNotes(route, method, segments)
      return
    }

    if (method === 'POST') {
      if (segments.length === 4 && segments[3] === 'interviews') {
        await this.handleCreateInterview(route, segments)
        return
      }

      if (segments.length === 4 && segments[3] === 'restore') {
        await this.handleRestore(route, segments)
        return
      }

      await this.handleCreate(route)
      return
    }

    if (method === 'PATCH') {
      if (segments.length === 4 && segments[3] === 'status') {
        await this.handleStatusChange(route, segments)
        return
      }

      if (segments.length === 5 && segments[3] === 'interviews') {
        await this.handleUpdateInterview(route, segments)
        return
      }

      await this.handleUpdate(route, segments)
      return
    }

    if (method === 'DELETE') {
      if (segments.length === 5 && segments[3] === 'interviews') {
        await this.handleDeleteInterview(route, segments)
        return
      }

      await this.handleDelete(route, segments)
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

    // `/api/applications/:id/status-changelogs`
    //
    // No changelogs are seeded; the detail page renders an empty timeline.
    // This must be an array (not the `{ data, count }` list envelope) or the
    // page's `changelogs.map` crashes.
    if (segments.length === 4 && segments[3] === 'status-changelogs') {
      await fulfillEnvelope(route, [])
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
    const showDeleted = url.searchParams.get('showDeleted') === 'true'
    const page = Number(url.searchParams.get('page') ?? 1)
    const limit = Number(url.searchParams.get('limit') ?? 10)

    this.applicationListRequests.push({ page, limit, statuses, search, showDeleted })

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
      // Mirrors the API: deleted rows are hidden unless `showDeleted` is set.
      const matchesVisibility = showDeleted || application.deletedAt === null

      return matchesStatus && matchesSearch && matchesVisibility
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

  /**
   * Handles `PATCH /api/applications/:id`.
   *
   * The payload is recorded before the (optional) failure is injected. On
   * success the seeded application is replaced so the list reflects the edit.
   */
  private async handleUpdate(route: Route, segments: string[]): Promise<void> {
    if (segments.length !== 3) {
      await fulfillApiError(route, 404, 'Application not found')
      return
    }

    const id = segments[2]
    const payload = readJsonBody<MockUpdateApplicationPayload>(route)
    this.updateRequests.push({ id, payload })

    await this.wait()

    if (this.updateApplicationFailure) {
      await this.respondWithFailure(route, this.updateApplicationFailure)
      return
    }

    const existing = this.applicationsData.find((app) => app.id === id)
    if (!existing) {
      await fulfillApiError(route, 404, 'Application not found')
      return
    }

    const now = new Date().toISOString()
    const updated: MockApplication = {
      ...existing,
      companyName: payload.companyName ?? existing.companyName,
      positionTitle: payload.positionTitle ?? existing.positionTitle,
      status: payload.status ?? existing.status,
      employmentType: payload.employmentType ?? existing.employmentType,
      workplaceType: payload.workplaceType ?? existing.workplaceType,
      jobLocation: payload.jobLocation ?? existing.jobLocation,
      updatedAt: now,
    }

    this.applicationsData = this.applicationsData.map((app) =>
      app.id === id ? updated : app,
    )

    await fulfillEnvelope(route, updated, 200)
  }

  /**
   * Handles `DELETE /api/applications/:id` (soft delete).
   *
   * The id is recorded before the (optional) failure. On success `deletedAt`
   * is set, so the record disappears from the default (non-deleted) list.
   */
  private async handleDelete(route: Route, segments: string[]): Promise<void> {
    if (segments.length !== 3) {
      await fulfillApiError(route, 404, 'Application not found')
      return
    }

    const id = segments[2]
    this.deleteRequests.push({ id })

    await this.wait()

    if (this.deleteApplicationFailure) {
      await this.respondWithFailure(route, this.deleteApplicationFailure)
      return
    }

    const existing = this.applicationsData.find((app) => app.id === id)
    if (!existing) {
      await fulfillApiError(route, 404, 'Application not found')
      return
    }

    const now = new Date().toISOString()
    const deleted: MockApplication = {
      ...existing,
      deletedAt: now,
      updatedAt: now,
    }

    this.applicationsData = this.applicationsData.map((app) =>
      app.id === id ? deleted : app,
    )

    await fulfillEnvelope(route, deleted, 200)
  }

  /**
   * Handles `PATCH /api/applications/:id/status`.
   *
   * The payload is recorded before the (optional) failure; on success the
   * seeded application's status is replaced.
   */
  private async handleStatusChange(
    route: Route,
    segments: string[],
  ): Promise<void> {
    const id = segments[2]
    const payload = readJsonBody<MockUpdateStatusPayload>(route)
    this.statusChangeRequests.push({ id, payload })

    await this.wait()

    if (this.statusChangeFailure) {
      await this.respondWithFailure(route, this.statusChangeFailure)
      return
    }

    const existing = this.applicationsData.find((app) => app.id === id)
    if (!existing) {
      await fulfillApiError(route, 404, 'Application not found')
      return
    }

    const now = new Date().toISOString()
    const updated: MockApplication = {
      ...existing,
      status: payload.status,
      updatedAt: now,
    }

    this.applicationsData = this.applicationsData.map((app) =>
      app.id === id ? updated : app,
    )

    await fulfillEnvelope(route, updated, 200)
  }

  /**
   * Handles `POST /api/applications/:id/restore`.
   */
  private async handleRestore(
    route: Route,
    segments: string[],
  ): Promise<void> {
    const id = segments[2]

    await this.wait()

    const existing = this.applicationsData.find((app) => app.id === id)
    if (!existing) {
      await fulfillApiError(route, 404, 'Application not found')
      return
    }

    const now = new Date().toISOString()
    const restored: MockApplication = {
      ...existing,
      deletedAt: null,
      updatedAt: now,
    }

    this.applicationsData = this.applicationsData.map((app) =>
      app.id === id ? restored : app,
    )

    await fulfillEnvelope(route, restored, 200)
  }

  /**
   * Handles `POST /api/applications/:id/interviews`.
   *
   * The payload is recorded before the (optional) failure; on success the
   * interview is appended to the seeded interviews.
   */
  private async handleCreateInterview(
    route: Route,
    segments: string[],
  ): Promise<void> {
    const applicationId = segments[2]
    const payload = readJsonBody<MockCreateInterviewPayload>(route)
    this.createInterviewRequests.push({ applicationId, payload })

    await this.wait()

    if (this.createInterviewFailure) {
      await this.respondWithFailure(route, this.createInterviewFailure)
      return
    }

    const now = new Date().toISOString()
    const created: MockInterview = {
      id: `int_e2e_created_${this.createInterviewRequests.length}`,
      applicationId,
      type: payload.type as MockInterviewType,
      scheduledAt: payload.scheduledAt,
      timezone: payload.timezone ?? null,
      location: payload.location ?? null,
      notes: payload.notes ?? null,
      createdAt: now,
      updatedAt: now,
    }

    this.interviewsData = [...this.interviewsData, created]

    await fulfillEnvelope(route, created, 201)
  }

  /**
   * Handles `PATCH /api/applications/:id/interviews/:interviewId`.
   */
  private async handleUpdateInterview(
    route: Route,
    segments: string[],
  ): Promise<void> {
    const applicationId = segments[2]
    const interviewId = segments[4]
    const payload = readJsonBody<Partial<MockCreateInterviewPayload>>(route)
    this.updateInterviewRequests.push({ applicationId, interviewId, payload })

    await this.wait()

    if (this.updateInterviewFailure) {
      await this.respondWithFailure(route, this.updateInterviewFailure)
      return
    }

    const existing = this.interviewsData.find(
      (interview) => interview.id === interviewId,
    )
    if (!existing) {
      await fulfillApiError(route, 404, 'Interview not found')
      return
    }

    const now = new Date().toISOString()
    const updated: MockInterview = {
      ...existing,
      type: (payload.type as MockInterviewType | undefined) ?? existing.type,
      scheduledAt: payload.scheduledAt ?? existing.scheduledAt,
      timezone: payload.timezone ?? existing.timezone,
      location: payload.location ?? existing.location,
      notes: payload.notes ?? existing.notes,
      updatedAt: now,
    }

    this.interviewsData = this.interviewsData.map((interview) =>
      interview.id === interviewId ? updated : interview,
    )

    await fulfillEnvelope(route, updated, 200)
  }

  /**
   * Handles `DELETE /api/applications/:id/interviews/:interviewId` (204).
   */
  private async handleDeleteInterview(
    route: Route,
    segments: string[],
  ): Promise<void> {
    const applicationId = segments[2]
    const interviewId = segments[4]
    this.deleteInterviewRequests.push({ applicationId, interviewId })

    await this.wait()

    if (this.deleteInterviewFailure) {
      await this.respondWithFailure(route, this.deleteInterviewFailure)
      return
    }

    this.interviewsData = this.interviewsData.filter(
      (interview) => interview.id !== interviewId,
    )

    await route.fulfill({ status: 204 })
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

    // `GET /api/interviews` — the calendar's visible month range.
    const from = url.searchParams.get('from') ?? ''
    const to = url.searchParams.get('to') ?? ''
    const timezone = url.searchParams.get('timezone') ?? ''

    this.interviewRangeRequests.push({ from, to, timezone })

    const fromTime = Date.parse(from)
    const toTime = Date.parse(to)
    const inRange = this.interviewsData
      .filter(
        (
          interview,
        ): interview is MockInterview & { scheduledAt: string } =>
          interview.scheduledAt !== null,
      )
      .filter((interview) => {
        const scheduledAt = Date.parse(interview.scheduledAt)
        return scheduledAt >= fromTime && scheduledAt < toTime
      })
      .sort(
        (left, right) =>
          Date.parse(left.scheduledAt) - Date.parse(right.scheduledAt),
      )

    await fulfillEnvelope(route, inRange)
  }

  /**
   * Handles the application-note sub-resource.
   *
   * - `GET    /api/applications/:id/notes`            → list (not soft-deleted)
   * - `POST   /api/applications/:id/notes`            → create (recorded)
   * - `PATCH  /api/applications/:id/notes/:noteId`    → update
   * - `DELETE /api/applications/:id/notes/:noteId`    → soft-delete
   */
  private async handleNotes(
    route: Route,
    method: string,
    segments: string[],
  ): Promise<void> {
    const applicationId = segments[2]
    const noteId = segments[4]

    await this.wait()

    // `/api/applications/:id/notes`
    if (segments.length === 4) {
      if (method === 'GET') {
        if (this.notesFailure) {
          await this.respondWithFailure(route, this.notesFailure)
          return
        }

        const notes = this.notesData.filter(
          (note) => note.applicationId === applicationId,
        )
        await fulfillEnvelope(route, notes)
        return
      }

      if (method === 'POST') {
        const payload = readJsonBody<MockCreateNotePayload>(route)
        this.createNoteRequests.push({ applicationId, payload })

        if (this.createNoteFailure) {
          await this.respondWithFailure(route, this.createNoteFailure)
          return
        }

        const now = new Date().toISOString()
        const created: MockApplicationNote = {
          id: `note_e2e_created_${this.createNoteRequests.length}`,
          applicationId,
          content: payload.content,
          createdAt: now,
          updatedAt: now,
        }
        this.notesData = [...this.notesData, created]
        await fulfillEnvelope(route, created, 201)
        return
      }
    }

    // `/api/applications/:id/notes/:noteId`
    if (segments.length === 5 && noteId) {
      const existing = this.notesData.find(
        (note) => note.id === noteId && note.applicationId === applicationId,
      )

      if (method === 'PATCH') {
        const payload = readJsonBody<MockUpdateNotePayload>(route)
        this.updateNoteRequests.push({ applicationId, noteId, payload })

        if (this.updateNoteFailure) {
          await this.respondWithFailure(route, this.updateNoteFailure)
          return
        }

        if (!existing) {
          await fulfillApiError(route, 404, 'Note not found')
          return
        }

        const updated: MockApplicationNote = {
          ...existing,
          content: payload.content ?? existing.content,
          updatedAt: new Date().toISOString(),
        }
        this.notesData = this.notesData.map((note) =>
          note.id === noteId ? updated : note,
        )
        await fulfillEnvelope(route, updated)
        return
      }

      if (method === 'DELETE') {
        this.deleteNoteRequests.push({ applicationId, noteId })

        if (this.deleteNoteFailure) {
          await this.respondWithFailure(route, this.deleteNoteFailure)
          return
        }

        if (!existing) {
          await fulfillApiError(route, 404, 'Note not found')
          return
        }

        this.notesData = this.notesData.filter((note) => note.id !== noteId)
        await route.fulfill({ status: 204 })
        return
      }
    }

    await fulfillApiError(
      route,
      501,
      `No notes mock registered for ${method} ${segments.join('/')}`,
    )
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
