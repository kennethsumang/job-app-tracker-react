import { expect, test } from '../../fixtures'
import { TEST_ACCOUNTS } from '../../fixtures/users'
import {
  buildApplication,
  type AppDataApiMock,
} from '../../mocks/app-data-api.mock'

/**
 * Applications list (`/app/applications`) happy paths.
 *
 * The list supports three filter dimensions — search, one or more statuses and
 * the "include deleted" switch — plus pagination. These specs exercise each one
 * on its own and combined, and assert both the rendered cards and the request
 * the UI actually sent.
 *
 * The seed is ordered and the mock serves it without re-sorting, so the card
 * order below is deterministic.
 */

const account = TEST_ACCOUNTS.verified

/**
 * A richer, deterministic seed for the filter journeys.
 *
 * Two APPLIED, two INTERVIEW, one OFFER and one REJECTED application, plus one
 * soft-deleted INTERVIEW record (Stark Industries). Deleted records are hidden
 * unless the "include deleted" filter is applied.
 */
function seedApplications(appApi: AppDataApiMock): void {
  appApi.setApplications([
    buildApplication({
      id: 'app_filter_1',
      companyName: 'Acme Corp',
      positionTitle: 'Senior Frontend Engineer',
      status: 'APPLIED',
    }),
    buildApplication({
      id: 'app_filter_2',
      companyName: 'Globex',
      positionTitle: 'Staff Engineer',
      status: 'INTERVIEW',
    }),
    buildApplication({
      id: 'app_filter_3',
      companyName: 'Initech',
      positionTitle: 'Platform Engineer',
      status: 'REJECTED',
    }),
    buildApplication({
      id: 'app_filter_4',
      companyName: 'Hooli',
      positionTitle: 'Frontend Developer',
      status: 'APPLIED',
    }),
    buildApplication({
      id: 'app_filter_5',
      companyName: 'Umbrella Corp',
      positionTitle: 'Security Engineer',
      status: 'OFFER',
    }),
    buildApplication({
      id: 'app_filter_6',
      companyName: 'Stark Industries',
      positionTitle: 'Frontend Developer',
      status: 'INTERVIEW',
      deletedAt: '2025-01-20T08:00:00.000Z',
    }),
  ])
}

/** Active (non-deleted) companies of the seed, in display order. */
const ACTIVE_COMPANIES = [
  'Acme Corp',
  'Globex',
  'Initech',
  'Hooli',
  'Umbrella Corp',
] as const

test.describe('Applications list', () => {
  test.beforeEach(async ({ authApi }) => {
    authApi.authenticateAs(account.user)
  })

  test('loads the list with every active application', async ({
    appApi,
    applicationsListPage,
  }) => {
    // Arrange
    seedApplications(appApi)

    // Act
    await applicationsListPage.goto()

    // Assert — the deleted record is hidden and the rest are listed in order
    await applicationsListPage.expectCompanies(ACTIVE_COMPANIES)
    await expect(applicationsListPage.card('Stark Industries')).toHaveCount(0)

    // Assert — the list asked for the first page with no filters applied
    expect(appApi.applicationListRequests.at(-1)).toMatchObject({
      page: 1,
      limit: 10,
      statuses: [],
      search: '',
      showDeleted: false,
    })
  })

  test('filters the list by a single status', async ({
    appApi,
    applicationsListPage,
  }) => {
    // Arrange
    seedApplications(appApi)
    await applicationsListPage.goto()

    // Act
    await applicationsListPage.openFilters()
    await applicationsListPage.toggleStatus('Applied')
    await applicationsListPage.applyFilters()

    // Assert
    await applicationsListPage.expectCompanies(['Acme Corp', 'Hooli'])
    expect(appApi.applicationListRequests.at(-1)).toMatchObject({
      statuses: ['APPLIED'],
    })
  })

  test('combines several statuses into one request', async ({
    appApi,
    applicationsListPage,
  }) => {
    // Arrange
    seedApplications(appApi)
    await applicationsListPage.goto()

    // Act
    await applicationsListPage.openFilters()
    await applicationsListPage.toggleStatus('Applied')
    await applicationsListPage.toggleStatus('Interview')
    await applicationsListPage.applyFilters()

    // Assert — the union of the two statuses, in toggle order
    await applicationsListPage.expectCompanies([
      'Acme Corp',
      'Globex',
      'Hooli',
    ])
    expect(appApi.applicationListRequests.at(-1)?.statuses).toEqual([
      'APPLIED',
      'INTERVIEW',
    ])
  })

  test('narrows the list with a status and search combined', async ({
    appApi,
    applicationsListPage,
  }) => {
    // Arrange
    seedApplications(appApi)
    await applicationsListPage.goto()

    // Act — search first, and wait for it to settle before adding the status
    await applicationsListPage.search('Engineer')
    await applicationsListPage.expectCompanies([
      'Acme Corp',
      'Globex',
      'Initech',
      'Umbrella Corp',
    ])
    await applicationsListPage.openFilters()
    await applicationsListPage.toggleStatus('Applied')
    await applicationsListPage.applyFilters()

    // Assert — both filters were sent and the intersection is rendered
    await applicationsListPage.expectCompanies(['Acme Corp'])
    expect(appApi.applicationListRequests.at(-1)).toMatchObject({
      search: 'engineer',
      statuses: ['APPLIED'],
    })
  })

  test('includes deleted applications when asked', async ({
    appApi,
    applicationsListPage,
  }) => {
    // Arrange
    seedApplications(appApi)
    await applicationsListPage.goto()

    // Act
    await applicationsListPage.openFilters()
    await applicationsListPage.setIncludeDeleted(true)
    await applicationsListPage.applyFilters()

    // Assert
    await applicationsListPage.expectCompanies([
      ...ACTIVE_COMPANIES,
      'Stark Industries',
    ])
    expect(appApi.applicationListRequests.at(-1)).toMatchObject({
      showDeleted: true,
    })
  })

  test('surfaces deleted applications through the deleted + status filter', async ({
    appApi,
    applicationsListPage,
  }) => {
    // Arrange
    seedApplications(appApi)
    await applicationsListPage.goto()

    // Act
    await applicationsListPage.openFilters()
    await applicationsListPage.setIncludeDeleted(true)
    await applicationsListPage.toggleStatus('Interview')
    await applicationsListPage.applyFilters()

    // Assert — the deleted INTERVIEW record is included
    await applicationsListPage.expectCompanies(['Globex', 'Stark Industries'])
    expect(appApi.applicationListRequests.at(-1)).toMatchObject({
      showDeleted: true,
      statuses: ['INTERVIEW'],
    })
  })

  test('shows the empty state when the search has no matches', async ({
    appApi,
    applicationsListPage,
  }) => {
    // Arrange
    seedApplications(appApi)
    await applicationsListPage.goto()

    // Act
    await applicationsListPage.search('Acme Industries')

    // Assert
    await applicationsListPage.expectEmptyState()
    expect(appApi.applicationListRequests.at(-1)).toMatchObject({
      search: 'acme industries',
    })
  })

  test('clears every filter in one action', async ({
    appApi,
    applicationsListPage,
  }) => {
    // Arrange
    seedApplications(appApi)
    await applicationsListPage.goto()
    await applicationsListPage.openFilters()
    await applicationsListPage.toggleStatus('Rejected')
    await applicationsListPage.applyFilters()
    await applicationsListPage.expectCompanies(['Initech'])

    // Act
    await applicationsListPage.clearAllFilters()

    // Assert — the full active list is back. The unfiltered query was already
    // cached by the initial load, so react-query serves it without a new
    // request; the rendered list is the reliable contract here.
    await applicationsListPage.expectCompanies(ACTIVE_COMPANIES)
  })

  test('paginates the results when there is more than one page', async ({
    appApi,
    applicationsListPage,
  }) => {
    // Arrange — 12 active applications split across two pages of ten
    appApi.setApplications(
      Array.from({ length: 12 }, (_, index) =>
        buildApplication({
          id: `app_page_${index + 1}`,
          companyName: `Company ${String(index + 1).padStart(2, '0')}`,
          positionTitle: `Position ${index + 1}`,
          status: 'APPLIED',
        }),
      ),
    )

    // Act — first page
    await applicationsListPage.goto()
    await applicationsListPage.expectCompanies(
      Array.from(
        { length: 10 },
        (_, index) => `Company ${String(index + 1).padStart(2, '0')}`,
      ),
    )
    await expect(applicationsListPage.pagination).toBeVisible()

    // Act — second page
    await applicationsListPage.goToPage(2)

    // Assert
    await applicationsListPage.expectCompanies(['Company 11', 'Company 12'])
    expect(appApi.applicationListRequests.at(-1)).toMatchObject({
      page: 2,
      limit: 10,
    })
  })
})
