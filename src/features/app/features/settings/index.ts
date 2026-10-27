export { settingsPaths, settingsRoutes } from './routes'

export { SettingsAccountSection } from './components/SettingsAccountSection'
export { SettingsDangerZoneSection } from './components/SettingsDangerZoneSection'
export { SettingsPreferencesSection } from './components/SettingsPreferencesSection'
export { SettingsSecuritySection } from './components/SettingsSecuritySection'
export { SettingsSessionSection } from './components/SettingsSessionSection'
export { ChangePasswordDialog } from './components/ChangePasswordDialog'
export { PickerDialog } from './components/PickerDialog'

export { ChangePasswordValidator } from './validators/change-password.validator'
export type { ChangePasswordInput } from './validators/change-password.validator'

export {
  userSettingsService,
  UserSettingsService
} from './services/user-settings.service'
export { COMMON_CURRENCIES } from './types'
export type { UpdateUserSettingsPayload, UserSettings } from './types'

export {
  userSettingsKeys,
  useUserSettings,
  useUpdateUserSettings,
  useDeleteAllUserData
} from './hooks/use-user-settings'