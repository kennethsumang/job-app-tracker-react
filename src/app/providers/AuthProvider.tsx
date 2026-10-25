import type { ReactNode } from 'react'
import { useAuthSession } from '@/features/auth/hooks/use-auth-session'
import { PageLoader } from '@/shared/components/PageLoader'

/** Props for {@link AuthProvider}. */
interface AuthProviderProps {
  /** Application tree rendered after the session resolves. */
  children: ReactNode
}

/**
 * Resolves the better-auth session before the router renders, so route guards
 * and the auth store always start from a known state.
 */
export function AuthProvider({ children }: Readonly<AuthProviderProps>) {
  const { isLoading } = useAuthSession()

  if (isLoading) {
    return <PageLoader />
  }

  return <>{children}</>
}
