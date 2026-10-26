import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { applicationsKeys } from "@/features/app/features/applications/hooks/use-applications";
import {
  applicationsService,
  type JobApplication,
} from "@/features/app/features/applications/services/applications.service";

/** Extra TanStack Query options accepted by {@link useApplication}. */
type ApplicationQueryOptions = Omit<
  UseQueryOptions<JobApplication>,
  "queryKey" | "queryFn"
>;

/** Fetches a single application by ID. */
export function useApplication(
  id: string,
  options?: ApplicationQueryOptions,
) {
  return useQuery<JobApplication>({
    queryKey: applicationsKeys.detail(id),
    queryFn: () => applicationsService.fetchApplication(id),
    enabled: Boolean(id),
    ...options,
  });
}
