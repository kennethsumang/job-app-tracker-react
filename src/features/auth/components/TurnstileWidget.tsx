import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { Turnstile } from '@marsidev/react-turnstile'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? ''
const TOKEN_MAX_AGE_MS = 4 * 60 * 1000 // Turnstile tokens expire at ~5 minutes.

/** Imperative API exposed by {@link TurnstileWidget}. */
export interface TurnstileWidgetRef {
  /** Resolves to the current token, refreshing it first when stale. */
  getResponse: () => Promise<string | undefined>
  /** Clears the current token and resets the widget. */
  reset: () => void
}

/** Props for {@link TurnstileWidget}. */
interface TurnstileWidgetProps {
  /** Called whenever the token changes or is cleared. */
  onTokenChange?: (token: string | undefined) => void
  /** Called with a user-facing message when verification fails. */
  onError?: (error: string) => void
}

/**
 * Cloudflare Turnstile widget, ported from `job-app-tracker-web`.
 *
 * Renders nothing when no site key is configured or while running the Vite dev
 * server, mirroring the web app. The ref exposes `getResponse()` and `reset()`
 * so the auth forms can attach the token to their requests.
 */
export const TurnstileWidget = forwardRef<
  TurnstileWidgetRef,
  TurnstileWidgetProps
>(function TurnstileWidget(
  { onTokenChange, onError }: Readonly<TurnstileWidgetProps>,
  ref,
) {
  const innerRef = useRef<TurnstileInstance | null>(null)
  const [tokenTimestamp, setTokenTimestamp] = useState<number | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const pendingResolveRef = useRef<
    ((token: string | undefined) => void) | null
  >(null)

  useImperativeHandle(
    ref,
    () => ({
      getResponse: async () => {
        if (!isLoaded || !innerRef.current) return undefined

        const token = innerRef.current.getResponse() ?? undefined

        const isStale =
          tokenTimestamp !== null &&
          Date.now() - tokenTimestamp > TOKEN_MAX_AGE_MS

        if (!isStale) return token

        // The token is expired: request a fresh one and wait for it before
        // returning. A stale token would be rejected by the API.
        return new Promise<string | undefined>((resolve) => {
          pendingResolveRef.current = resolve
          innerRef.current?.reset()

          // Safety net in case Turnstile never re-issues a token.
          setTimeout(() => {
            if (pendingResolveRef.current === resolve) {
              pendingResolveRef.current = null
              resolve(innerRef.current?.getResponse() ?? undefined)
            }
          }, 5000)
        })
      },
      reset: () => {
        innerRef.current?.reset()
        if (pendingResolveRef.current) {
          pendingResolveRef.current(undefined)
          pendingResolveRef.current = null
        }
      },
    }),
    [isLoaded, tokenTimestamp],
  )

  const handleSuccess = useCallback(
    (newToken: string) => {
      setTokenTimestamp(Date.now())
      onTokenChange?.(newToken)

      if (pendingResolveRef.current) {
        pendingResolveRef.current(newToken)
        pendingResolveRef.current = null
      }
    },
    [onTokenChange],
  )

  const handleError = useCallback(
    (errorCode?: string) => {
      const message = errorCode
        ? `Captcha verification failed. Please try again. (${errorCode})`
        : 'Captcha verification failed. Please try again.'
      setTokenTimestamp(null)
      onTokenChange?.(undefined)
      onError?.(message)

      if (pendingResolveRef.current) {
        pendingResolveRef.current(undefined)
        pendingResolveRef.current = null
      }
    },
    [onTokenChange, onError],
  )

  const handleTimeout = useCallback(() => {
    handleError('timeout')
  }, [handleError])

  const handleWidgetLoad = useCallback(() => {
    setIsLoaded(true)
  }, [])

  // Refresh the token before it expires while the widget is mounted.
  useEffect(() => {
    if (!isLoaded || !tokenTimestamp || !innerRef.current) return

    const refreshIn = TOKEN_MAX_AGE_MS - (Date.now() - tokenTimestamp)
    if (refreshIn <= 0) return

    const timer = setTimeout(() => {
      innerRef.current?.reset()
    }, refreshIn)

    return () => clearTimeout(timer)
  }, [isLoaded, tokenTimestamp])

  if (!TURNSTILE_SITE_KEY) return null

  // Skip rendering during development to avoid console noise from Cloudflare's
  // challenge platform. The API also skips verification when no secret is set.
  if (import.meta.env.DEV) return null

  return (
    <Turnstile
      ref={innerRef}
      siteKey={TURNSTILE_SITE_KEY}
      onSuccess={handleSuccess}
      onError={handleError}
      onExpire={handleTimeout}
      onWidgetLoad={handleWidgetLoad}
      options={{
        appearance: 'interaction-only',
        theme: 'auto',
      }}
    />
  )
})
