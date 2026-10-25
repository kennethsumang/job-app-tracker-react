import type { RouteObject } from 'react-router'
import { appRoutes } from '@/features/app'
import { authRoutes } from '@/features/auth'
import { RouteError } from '@/shared/components/RouteError'
import { PageLoader } from '@/shared/components/PageLoader'
import { AppLayout, AuthLayout, RootLayout } from '../layouts'
import { NotFoundPage } from '../pages/NotFoundPage'

/**
 * Route tree composition root.
 *
 * Layouts own the cross-cutting concerns: `RootLayout` is the document shell
 * rendered for every route, `AuthLayout` wraps the public auth screens, and
 * `AppLayout` guards and frames the authenticated application routes.
 */
export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <PageLoader />,
    children: [
      {
        element: <AuthLayout />,
        children: [...authRoutes],
      },
      {
        element: <AppLayout />,
        children: [...appRoutes],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
