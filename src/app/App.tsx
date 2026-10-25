import { RouterProvider } from 'react-router/dom'
import { AuthProvider, MuiProvider, QueryProvider } from './providers'
import { router } from './router'

/**
 * Application composition root.
 *
 * Provider order: query client → MUI theme → auth session → router.
 */
export function App() {
  return (
    <QueryProvider>
      <MuiProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </MuiProvider>
    </QueryProvider>
  )
}
