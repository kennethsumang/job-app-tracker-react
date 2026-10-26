import type { Page, Route } from '@playwright/test'
import { fulfillApiError, fulfillEnvelope } from './http'

/**
 * In-browser mock of the read-only API endpoints the authenticated shell needs
 * right after a successful sign-in.
 *
 * Without these, the dashboard would render react-query error states and any
 * "lands on the dashboard" assertion would be flaky or meaningless. Only the
 * endpoints the login flow touches are mocked — extend this module when new
 * journeys need more data.
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
}

/** Expected dashboard counters derived from the seeded applications. */
export interface DashboardCounts {
  total: number
  inProgress: number
}

/** Statuses the dashboard treats as "in progress" (see `use-dashboard.ts`). */
const IN_PROGRESS_STATUSES = new Set([
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'TECHNICAL_INTERVIEW',
  'FINAL_INTERVIEW',
  'OFFER',
])

export class AppDataApiMock {
  private readonly page: Page
  readonly applications: readonly MockApplication[]

  constructor(page: Page, options: AppDataApiMockOptions = {}) {
    this.page = page
    this.applications = options.applications ?? DEFAULT_APPLICATIONS
  }

  /** Counters the UI should display for the seeded data. */
  get dashboardCounts(): DashboardCounts {
    return {
      total: this.applications.length,
      inProgress: this.applications.filter((application) =>
        IN_PROGRESS_STATUSES.has(application.status),
      ).length,
    }
  }

  /** Registers the route handlers. Must run before the first navigation. */
  async install(): Promise<void> {
    await this.page.route('**/api/applications**', (route) =>
      this.handleApplications(route),
    )
    await this.page.route('**/api/interviews/**', (route) =>
      this.handleInterviews(route),
    )
  }

  private async handleApplications(route: Route): Promise<void> {
    const method = route.request().method()
    const url = new URL(route.request().url())
    const segments = url.pathname.split('/').filter(Boolean)

    if (method !== 'GET') {
      await fulfillApiError(
        route,
        501,
        `No applications mock registered for ${method} ${url.pathname}`,
      )
      return
    }

    // `/api/applications/:id`
    if (segments.length === 3) {
      const application = this.applications.find(
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

    const filtered = this.applications.filter((application) => {
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

  private async handleInterviews(route: Route): Promise<void> {
    // The dashboard asks for the next interview; an empty list hides the card.
    await fulfillEnvelope(route, [])
  }
}
