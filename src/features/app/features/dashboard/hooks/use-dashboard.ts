import {
  useApplicationsCount,
  type ApplicationFilters,
  type JobApplicationStatus,
} from "@/features/app/features/applications";

export const IN_PROGRESS_STATUSES = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "TECHNICAL_INTERVIEW",
  "FINAL_INTERVIEW",
  "OFFER",
] as const satisfies readonly JobApplicationStatus[];

const IN_PROGRESS_FILTERS: ApplicationFilters = {
  statuses: [...IN_PROGRESS_STATUSES],
};

export function useTotalApplicationsCount() {
  return useApplicationsCount();
}

export function useInProgressApplicationsCount() {
  return useApplicationsCount(IN_PROGRESS_FILTERS);
}

export { useUpcomingInterview } from "@/features/app/features/interviews";