import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  applicationsService,
  type ApplicationFilters,
  type ApplicationsResponse,
  type CreateApplicationPayload,
  type JobApplication,
  type UpdateApplicationPayload,
  type UpdateApplicationStatusPayload,
} from "@/features/app/features/applications/services/applications.service";

/**
 * Cache keys for the applications domain.
 *
 * Every applications query lives under the `["applications"]` prefix, so a
 * single invalidation refreshes lists, counts and details after a mutation.
 */
export const applicationsKeys = {
  all: ["applications"] as const,
  lists: () => [...applicationsKeys.all, "list"] as const,
  list: (filters: ApplicationFilters) =>
    [...applicationsKeys.lists(), filters] as const,
  counts: () => [...applicationsKeys.all, "count"] as const,
  count: (filters: ApplicationFilters) =>
    [...applicationsKeys.counts(), filters] as const,
  details: () => [...applicationsKeys.all, "detail"] as const,
  detail: (id: string) => [...applicationsKeys.details(), id] as const,
};

/** Extra TanStack Query options accepted by the applications query hooks. */
type ApplicationsQueryOptions<T> = Omit<
  UseQueryOptions<T>,
  "queryKey" | "queryFn"
>;

/** Fetches the authenticated user's applications, optionally filtered. */
export function useApplications(
  filters: ApplicationFilters = {},
  options?: ApplicationsQueryOptions<ApplicationsResponse>,
) {
  return useQuery<ApplicationsResponse>({
    queryKey: applicationsKeys.list(filters),
    queryFn: () => applicationsService.fetchApplications(filters),
    ...options,
  });
}

/** Fetches only the total count of applications matching the filters. */
export function useApplicationsCount(
  filters: ApplicationFilters = {},
  options?: ApplicationsQueryOptions<number>,
) {
  return useQuery<number>({
    queryKey: applicationsKeys.count(filters),
    queryFn: () => applicationsService.fetchApplicationsCount(filters),
    ...options,
  });
}

/** Creates an application and invalidates the applications cache. */
export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation<JobApplication, Error, CreateApplicationPayload>({
    mutationFn: (payload) => applicationsService.createApplication(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationsKeys.all });
    },
    throwOnError: false,
  });
}

/** Partially updates an application and invalidates the applications cache. */
export function useUpdateApplication() {
  const queryClient = useQueryClient();

  return useMutation<
    JobApplication,
    Error,
    { id: string; payload: UpdateApplicationPayload }
  >({
    mutationFn: ({ id, payload }) =>
      applicationsService.updateApplication(id, payload),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: applicationsKeys.all });
      void queryClient.invalidateQueries({
        queryKey: ["status-changelogs", id],
      });
    },
    throwOnError: false,
  });
}

/** Soft-deletes an application (sets `deletedAt`). */
export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation<JobApplication, Error, string>({
    mutationFn: (id) => applicationsService.deleteApplication(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationsKeys.all });
    },
    throwOnError: false,
  });
}

/** Restores a soft-deleted application. */
export function useRestoreApplication() {
  const queryClient = useQueryClient();

  return useMutation<JobApplication, Error, string>({
    mutationFn: (id) => applicationsService.restoreApplication(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: applicationsKeys.all });
      void queryClient.invalidateQueries({
        queryKey: ["status-changelogs", id],
      });
    },
    throwOnError: false,
  });
}

/** Permanently deletes an application and its related records. */
export function usePermanentDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => applicationsService.permanentDeleteApplication(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationsKeys.all });
    },
    throwOnError: false,
  });
}

/** Variables accepted by {@link useUpdateApplicationStatus}. */
export interface UpdateApplicationStatusVariables {
  id: string;
  payload: UpdateApplicationStatusPayload;
}

/** Updates only an application's status and invalidates its caches. */
export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation<JobApplication, Error, UpdateApplicationStatusVariables>({
    mutationFn: ({ id, payload }) =>
      applicationsService.updateApplicationStatus(
        id,
        payload.status,
        payload.changedAt,
      ),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: applicationsKeys.all });
      void queryClient.invalidateQueries({
        queryKey: ["status-changelogs", id],
      });
    },
    throwOnError: false,
  });
}
