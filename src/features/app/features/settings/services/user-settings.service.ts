import { api } from '@/lib/api.library'
import type {
  UpdateUserSettingsPayload,
  UserSettings
} from '@/features/app/features/settings/types'

/**
 * UserSettingsService
 * Service for managing the authenticated user's settings via the API. It is
 * the single entry point for the `/settings` endpoints and is meant to be
 * consumed by the TanStack Query hooks in this feature.
 */
class UserSettingsService {
  /**
   * Fetches the authenticated user's settings.
   * @returns {Promise<UserSettings>}
   */
  fetchSettings(): Promise<UserSettings> {
    return api.get<UserSettings>('/settings')
  }

  /**
   * Partially updates the authenticated user's settings.
   * @param   {UpdateUserSettingsPayload} payload - The settings fields to update.
   * @returns {Promise<UserSettings>} The updated settings.
   */
  updateSettings(payload: UpdateUserSettingsPayload): Promise<UserSettings> {
    return api.patch<UserSettings>('/settings', payload)
  }

  /**
   * Permanently deletes the authenticated user's account and all associated
   * data.
   * @returns {Promise<void>}
   */
  deleteAllUserData(): Promise<void> {
    return api.delete<void>('/users/me')
  }
}

export { UserSettingsService }

/** Shared instance used by the settings query hooks. */
export const userSettingsService = new UserSettingsService()
