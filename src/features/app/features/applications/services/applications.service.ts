import { api } from "@/lib/api.library";

// ── API contract ────────────────────────────────────────────────────────────
//
// Request/response shapes for the `/applications` endpoints, mirroring the
// NestJS API (`X-Api-Version: 1`, cookie-session auth). They are co-located
// with the service for now so it stays self-contained; extract them into a
// feature-level `types.ts` once the rest of the applications feature is ported.

/** Statuses accepted by the API's `applicationStatusEnum`. */
export type JobApplicationStatus =
  | "DRAFT"
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "TECHNICAL_INTERVIEW"
  | "FINAL_INTERVIEW"
  | "OFFER"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

/** Employment types accepted by the API. */
export type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERNSHIP"
  | "TEMPORARY"
  | "FREELANCE";

/** Workplace arrangements accepted by the API. */
export type WorkplaceType = "REMOTE" | "HYBRID" | "ONSITE";

/** A job application as returned by the API (dates are ISO strings). */
export interface JobApplication {
  id: string;
  userId: string;
  companyName: string;
  companyWebsite: string | null;
  positionTitle: string;
  jobLocation: string | null;
  employmentType: EmploymentType | null;
  workplaceType: WorkplaceType | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  status: JobApplicationStatus;
  appliedAt?: string | null;
  lastContactedAt: string | null;
  offerDeadline: string | null;
  rejectedAt: string | null;
  recruiterName: string | null;
  recruiterEmail: string | null;
  recruiterPhone: string | null;
  jobPostingUrl: string | null;
  coverLetterUrl: string | null;
  source: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Paginated response returned by `GET /applications`. */
export interface ApplicationsResponse {
  data: JobApplication[];
  count: number;
}

/** Filters accepted by `GET /applications`. */
export interface ApplicationFilters {
  search?: string;
  statuses?: JobApplicationStatus[];
  showDeleted?: boolean;
  page?: number;
  limit?: number;
  /** ISO date; requires `appliedTo`. */
  appliedFrom?: string;
  /** ISO date; requires `appliedFrom`. */
  appliedTo?: string;
  /** IANA timezone used to resolve the applied-at date range. */
  timezone?: string;
}

/** Payload accepted by `POST /applications`. */
export interface CreateApplicationPayload {
  companyName: string;
  positionTitle: string;
  status?: JobApplicationStatus;
  employmentType?: EmploymentType;
  workplaceType?: WorkplaceType;
  jobLocation?: string;
  companyWebsite?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  notes?: string;
}

/** Payload accepted by `PATCH /applications/:id`. */
export type UpdateApplicationPayload = Partial<CreateApplicationPayload>;

/** Payload accepted by `PATCH /applications/:id/status`. */
export interface UpdateApplicationStatusPayload {
  status: JobApplicationStatus;
  /** ISO timestamp; defaults to now when omitted and must not be in the future. */
  changedAt?: string;
}

/**
 * ApplicationsService
 * Service for managing job applications via the API. It is the single entry
 * point for the `/applications` endpoints and is meant to be consumed by
 * TanStack Query hooks (queries/mutations) and pages.
 */
class ApplicationsService {
  /**
   * Lists the authenticated user's job applications.
   * @param   {ApplicationFilters} filters - Search, status, pagination and date filters.
   * @returns {Promise<ApplicationsResponse>} The page of applications plus the total count.
   */
  fetchApplications(
    filters: ApplicationFilters = {},
  ): Promise<ApplicationsResponse> {
    return api.get<ApplicationsResponse>("/applications", {
      query: {
        search: filters.search,
        statuses: filters.statuses,
        showDeleted: filters.showDeleted,
        page: filters.page,
        limit: filters.limit,
        appliedFrom: filters.appliedFrom,
        appliedTo: filters.appliedTo,
        timezone: filters.timezone,
      },
    });
  }

  /**
   * Counts the authenticated user's job applications for the given filters.
   * Requests a single-row page so only the total count is transferred.
   * @param   {ApplicationFilters} filters - The filters to count.
   * @returns {Promise<number>} The total number of matching applications.
   */
  async fetchApplicationsCount(
    filters: ApplicationFilters = {},
  ): Promise<number> {
    const response = await this.fetchApplications({
      ...filters,
      page: 1,
      limit: 1,
    });
    return response.count;
  }

  /**
   * Fetches a single job application.
   * @param   {string} id - The application ID.
   * @returns {Promise<JobApplication>}
   */
  fetchApplication(id: string): Promise<JobApplication> {
    return api.get<JobApplication>(`/applications/${id}`);
  }

  /**
   * Creates a job application.
   * @param   {CreateApplicationPayload} payload - The application data.
   * @returns {Promise<JobApplication>} The created application.
   */
  createApplication(payload: CreateApplicationPayload): Promise<JobApplication> {
    return api.post<JobApplication>("/applications", payload);
  }

  /**
   * Partially updates a job application.
   * @param   {string} id - The application ID.
   * @param   {UpdateApplicationPayload} payload - The fields to update.
   * @returns {Promise<JobApplication>} The updated application.
   */
  updateApplication(
    id: string,
    payload: UpdateApplicationPayload,
  ): Promise<JobApplication> {
    return api.patch<JobApplication>(`/applications/${id}`, payload);
  }

  /**
   * Soft-deletes a job application (sets `deletedAt`).
   * @param   {string} id - The application ID.
   * @returns {Promise<JobApplication>} The soft-deleted application.
   */
  deleteApplication(id: string): Promise<JobApplication> {
    return api.delete<JobApplication>(`/applications/${id}`);
  }

  /**
   * Restores a soft-deleted job application.
   * @param   {string} id - The application ID.
   * @returns {Promise<JobApplication>} The restored application.
   */
  restoreApplication(id: string): Promise<JobApplication> {
    return api.post<JobApplication>(`/applications/${id}/restore`);
  }

  /**
   * Updates only the status of a job application.
   * @param   {string} id - The application ID.
   * @param   {JobApplicationStatus} status - The new status.
   * @param   {string} [changedAt] - Optional ISO timestamp for when the change happened.
   * @returns {Promise<JobApplication>} The updated application.
   */
  updateApplicationStatus(
    id: string,
    status: JobApplicationStatus,
    changedAt?: string,
  ): Promise<JobApplication> {
    const payload: UpdateApplicationStatusPayload = changedAt
      ? { status, changedAt }
      : { status };
    return api.patch<JobApplication>(`/applications/${id}/status`, payload);
  }

  /**
   * Permanently deletes a job application and its related records.
   * @param   {string} id - The application ID.
   * @returns {Promise<void>}
   */
  async permanentDeleteApplication(id: string): Promise<void> {
    await api.delete<void>(`/applications/${id}/permanent`);
  }
}

export { ApplicationsService };

/** Shared instance used by the applications query hooks. */
export const applicationsService = new ApplicationsService();
