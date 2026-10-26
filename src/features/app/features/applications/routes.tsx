import type { RouteObject } from 'react-router'
import { APP_HOME_PATH } from '@/shared/config/routes'

const applicationsSegment = 'applications'

/** Route paths for the applications feature. */
export const applicationsPaths = {
  list: `${APP_HOME_PATH}/${applicationsSegment}`,
  /** Detail page of a single application. */
  detail: (id: string) => `${APP_HOME_PATH}/${applicationsSegment}/${id}`
} as const

/** Lazy route definitions for the applications feature. */
export const applicationsRoutes: RouteObject[] = [
  {
    path: applicationsSegment,
    lazy: async () => {
      const { ApplicationsPage } = await import('./pages/ApplicationsPage')
      return { Component: ApplicationsPage }
    }
  },
  {
    path: `${applicationsSegment}/:id`,
    lazy: async () => {
      const { ApplicationDetailPage } = await import(
        './pages/ApplicationDetailPage'
      )
      return { Component: ApplicationDetailPage }
    }
  }
]
