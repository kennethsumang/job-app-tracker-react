import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { humaniseError } from '@/lib/auth-errors'
import { APP_HOME_PATH } from '@/shared/config/routes'
import { AuthShell } from '../components/AuthShell'
import { ErrorBanner } from '../components/ErrorBanner'
import { PasswordField } from '../components/PasswordField'
import {
  TurnstileWidget,
  type TurnstileWidgetRef,
} from '../components/TurnstileWidget'
import { useSignIn } from '../hooks/use-auth'
import { authPaths } from '../routes'
import { useAuthStore } from '../store/auth.store'
import {
  SignInValidator,
  type SignInInput,
} from '../validators/sign-in.validator'

const signInValidator = new SignInValidator()

/**
 * Email/password sign-in screen.
 *
 * Validates locally, attaches a Turnstile token when available, signs in via
 * better-auth, and redirects to the originally requested app route.
 */
export function LoginPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const signIn = useSignIn()
  const isLoading = signIn.isPending

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState({ email: false, password: false })
  const [submitError, setSubmitError] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileWidgetRef | null>(null)

  // Authenticated users should not see the login screen.
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      void navigate(APP_HOME_PATH, { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  /**
   * Returns the first validation error for a field, or null when valid.
   *
   * @param field - Field to read from the validator result.
   */
  function getFieldError(field: keyof SignInInput): string | null {
    const result = signInValidator.validate({ email, password })
    if (result.success) return null
    return result.errors[field]?.[0] ?? null
  }

  const emailError = touched.email ? getFieldError('email') : null
  const passwordError = touched.password ? getFieldError('password') : null

  /**
   * Validates the form, signs in, and redirects. Failures are mapped to
   * user-facing copy via {@link humaniseError}.
   *
   * @param event - Form submission event.
   */
  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouched({ email: true, password: true })
    setSubmitError(null)

    if (!signInValidator.validate({ email, password }).success) return

    try {
      const turnstileToken = await turnstileRef.current?.getResponse()
      await signIn.mutateAsync({ email: email.trim(), password, turnstileToken })

      // Return to the protected route that triggered the login redirect.
      const state = location.state as { from?: string } | null
      const destination =
        state?.from?.startsWith('/') ? state.from : APP_HOME_PATH
      await navigate(destination, { replace: true })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? humaniseError(error.message)
          : t('login.error'),
      )
      turnstileRef.current?.reset()
    }
  }

  return (
    <AuthShell subtitle={t('login.subtitle')}>
      <Box
        component="form"
        noValidate
        aria-label={t('login.formLabel')}
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        {submitError ? <ErrorBanner message={submitError} /> : null}

        <TextField
          id="login-email"
          name="email"
          label={t('login.email')}
          type="email"
          autoComplete="email"
          placeholder={t('login.emailPlaceholder')}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
          error={Boolean(emailError)}
          helperText={emailError ?? ' '}
          required
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlinedIcon fontSize="small" aria-hidden="true" />
                </InputAdornment>
              ),
            },
          }}
        />

        <PasswordField
          id="login-password"
          name="password"
          label={t('login.password')}
          autoComplete="current-password"
          showLabel={t('login.showPassword')}
          hideLabel={t('login.hidePassword')}
          value={password}
          onChange={setPassword}
          onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
          error={Boolean(passwordError)}
          helperText={passwordError}
        />

        <TurnstileWidget ref={turnstileRef} />

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <CircularProgress
              size={22}
              color="inherit"
              aria-label={t('login.submitting')}
            />
          ) : (
            t('login.submit')
          )}
        </Button>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <Typography variant="body2">{t('login.noAccount')}</Typography>
          <Button
            type="button"
            variant="text"
            size="small"
            disabled={isLoading}
            onClick={() => navigate(authPaths.register)}
          >
            {t('login.signUp')}
          </Button>
        </Box>
      </Box>
    </AuthShell>
  )
}
