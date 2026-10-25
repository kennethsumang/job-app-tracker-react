import type { RouteObject } from 'react-router'
import { APP_HOME_PATH } from '@/shared/config/routes'

const calendarSegment = 'calendar'

/** Route paths for the applications feature. */
export const calendarPaths = {
  list: APP_HOME_PATH,
} as const

/** Lazy route definitions for the applications feature. */
export const calendarRoutes: RouteObject[] = [
  {
    path: calendarSegment,
    lazy: async () => {
      const { CalendarPage } = await import('./pages/CalendarPage')
      return { Component: CalendarPage }
    }
  },
]
