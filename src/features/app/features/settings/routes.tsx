import type { RouteObject } from 'react-router'
import { APP_HOME_PATH } from '@/shared/config/routes'

const settingsSegment = 'settings'

/** Route paths for the settings feature. */
export const settingsPaths = {
  list: APP_HOME_PATH,
} as const

/** Lazy route definitions for the settings feature. */
export const settingsRoutes: RouteObject[] = [
  {
    path: settingsSegment,
    lazy: async () => {
      const { SettingsPage } = await import('./pages/SettingsPage')
      return { Component: SettingsPage }
    }
  },
]
