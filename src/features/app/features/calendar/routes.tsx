import type { RouteObject } from 'react-router'
import { APP_HOME_PATH } from '@/shared/config/routes'

const calendarSegment = 'calendar'

/** Route paths for the calendar feature. */
export const calendarPaths = {
  list: `${APP_HOME_PATH}/${calendarSegment}`,
} as const

/** Lazy route definitions for the calendar feature. */
export const calendarRoutes: RouteObject[] = [
  {
    path: calendarSegment,
    lazy: async () => {
      const { CalendarPage } = await import('./pages/CalendarPage')
      return { Component: CalendarPage }
    }
  },
]
