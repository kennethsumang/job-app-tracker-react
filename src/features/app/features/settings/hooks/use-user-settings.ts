import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api.library'
import { userSettingsService } from '@/features/app/features/settings/services/user-settings.service'
import type {
  UpdateUserSettingsPayload,
  UserSettings
} from '@/features/app/features/settings/types'

/**
 * Cache key for the settings query. There is only ever one settings record per
 * user, so a single invalidation refreshes the whole domain.
 */
export const userSettingsKeys = {
  all: ['settings'] as const
}

/** Fetches the authenticated user's settings. */
export function useUserSettings(enabled = true) {
  return useQuery<UserSettings>({
    queryKey: userSettingsKeys.all,
    queryFn: () => userSettingsService.fetchSettings(),
    enabled,
    retry: (failureCount, error) => {
      // A 401 means the session expired; don't hammer the API with retries.
      if (error instanceof ApiError && error.status === 401) return false
      return failureCount < 2
    }
  })
}

/** Partially updates the user's settings and invalidates the cache. */
export function useUpdateUserSettings() {
  const queryClient = useQueryClient()

  return useMutation<UserSettings, Error, UpdateUserSettingsPayload>({
    mutationFn: (payload) => userSettingsService.updateSettings(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userSettingsKeys.all })
    },
    throwOnError: false
  })
}

/** Permanently deletes the user's account and all associated data. */
export function useDeleteAllUserData() {
  return useMutation<void, Error>({
    mutationFn: () => userSettingsService.deleteAllUserData(),
    throwOnError: false
  })
}
