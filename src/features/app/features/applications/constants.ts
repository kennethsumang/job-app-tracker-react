import type {
  EmploymentType,
  JobApplicationStatus,
  WorkplaceType
} from './services/applications.service'

/** Every application status accepted by the API, in display order. */
export const JOB_APPLICATION_STATUSES: readonly JobApplicationStatus[] = [
  'DRAFT',
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'TECHNICAL_INTERVIEW',
  'FINAL_INTERVIEW',
  'OFFER',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN'
]

/** Every employment type accepted by the API, in display order. */
export const EMPLOYMENT_TYPES: readonly EmploymentType[] = [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERNSHIP',
  'TEMPORARY',
  'FREELANCE'
]

/** Every workplace arrangement accepted by the API, in display order. */
export const WORKPLACE_TYPES: readonly WorkplaceType[] = [
  'REMOTE',
  'HYBRID',
  'ONSITE'
]

/** MUI `Chip` colours available to {@link STATUS_CHIP_COLORS}. */
type ChipColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning'

/** Chip colour used for each application status. */
export const STATUS_CHIP_COLORS: Record<JobApplicationStatus, ChipColor> = {
  DRAFT: 'default',
  APPLIED: 'info',
  SCREENING: 'info',
  INTERVIEW: 'primary',
  TECHNICAL_INTERVIEW: 'primary',
  FINAL_INTERVIEW: 'secondary',
  OFFER: 'success',
  ACCEPTED: 'success',
  REJECTED: 'error',
  WITHDRAWN: 'warning'
}

/**
 * Page size requested from `GET /applications`.
 *
 * It mirrors the API default (`limit = 10`) so the pagination controls stay in
 * sync with the page that was actually fetched.
 */
export const DEFAULT_PAGE_SIZE = 10

/** Currency used when the user has not chosen one yet. */
export const DEFAULT_CURRENCY = 'USD'

/** Currencies offered by the application form. */
export const COMMON_CURRENCIES: readonly string[] = [
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'CHF',
  'SEK',
  'JPY',
  'INR',
  'BRL',
  'MXN',
  'ZAR',
  'SGD',
  'NZD'
]

/**
 * Narrows a raw string to a known {@link JobApplicationStatus}.
 *
 * @param value - Candidate status, e.g. a value read from a search param.
 * @returns True when the API accepts the status.
 */
export function isJobApplicationStatus(
  value: string
): value is JobApplicationStatus {
  return (JOB_APPLICATION_STATUSES as readonly string[]).includes(value)
}
