import type { RouteObject } from 'react-router'
import { APP_HOME_PATH } from '@/shared/config/routes'

const dashboardSegment = ''

/** Route paths for the applications feature. */
export const dashboardPaths = {
  list: APP_HOME_PATH,
} as const

/** Lazy route definitions for the applications feature. */
export const dashboardRoutes: RouteObject[] = [
  {
    path: dashboardSegment,
    lazy: async () => {
      const { DashboardPage } = await import('./pages/DashboardPage')
      return { Component: DashboardPage }
    }
  },
]
