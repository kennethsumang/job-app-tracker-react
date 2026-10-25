import type { RouteObject } from 'react-router'
import { APP_HOME_PATH } from '@/shared/config/routes'
import { dashboardRoutes } from './features/dashboard/routes'
import { calendarRoutes } from './features/calendar'
import { applicationsRoutes } from './features/applications'
import { settingsRoutes } from './features/settings'

const appSegment = 'app'

/** Route paths for the authenticated application. */
export const appPaths = {
  list: APP_HOME_PATH,
} as const

/**
 * Route definitions for the authenticated application area.
 *
 * The shell (`AppLayout`) is mounted by the router as the parent of these
 * routes, so this list only describes the pages themselves.
 */
export const appRoutes: RouteObject[] = [
  {
    path: appSegment,
    children: [
      ...dashboardRoutes,
      ...calendarRoutes,
      ...applicationsRoutes,
      ...settingsRoutes
    ],
  },
]
