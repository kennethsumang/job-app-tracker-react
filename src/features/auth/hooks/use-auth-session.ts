import { useEffect } from 'react'
import { useSession } from '@/features/auth/lib/auth-client'
import { useAuthStore } from '@/features/auth/store/auth.store'

/**
 * Initializes the auth session on application mount.
 *
 * Uses better-auth's `useSession` hook, which fetches the session from the
 * API (via the `/api/auth` proxy) and keeps it in sync reactively. The API
 * extends the session on each fetch, so no proactive client-side refresh loop
 * is needed — better-auth handles session lifecycle server-side.
 */
export function useAuthSession(): { isLoading: boolean } {
  const setUser = useAuthStore((s) => s.setUser)
  const setLoading = useAuthStore((s) => s.setLoading)
  const isLoading = useAuthStore((s) => s.isLoading)

  const { data: session, isPending } = useSession()

  useEffect(() => {
    setUser(session?.user ?? null)
  }, [session, setUser])

  useEffect(() => {
    if (!isPending) {
      setLoading(false)
    }
  }, [isPending, setLoading])

  return { isLoading }
}
