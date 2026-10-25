import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { humaniseError } from '@/lib/auth-errors'
import { APP_HOME_PATH } from '@/shared/config/routes'
import { AuthShell } from '../components/AuthShell'
import { ErrorBanner } from '../components/ErrorBanner'
import { PasswordField } from '../components/PasswordField'
import {
  TurnstileWidget,
  type TurnstileWidgetRef,
} from '../components/TurnstileWidget'
import { useSignUp } from '../hooks/use-auth'
import { authPaths } from '../routes'
import { useAuthStore } from '../store/auth.store'
import {
  SignUpValidator,
  type SignUpInput,
} from '../validators/sign-up.validator'

const signUpValidator = new SignUpValidator()

/**
 * Account registration screen.
 *
 * Validates the form, attaches a Turnstile token when available, registers via
 * better-auth, and redirects into the application.
 */
export function RegisterPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const signUp = useSignUp()
  const isLoading = signUp.isPending

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  })
  const [submitError, setSubmitError] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileWidgetRef | null>(null)

  // Authenticated users should not see the registration screen.
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
  function getFieldError(field: keyof SignUpInput): string | null {
    const result = signUpValidator.validate({
      name,
      email,
      password,
      confirmPassword,
    })
    if (result.success) return null
    return result.errors[field]?.[0] ?? null
  }

  const nameError = touched.name ? getFieldError('name') : null
  const emailError = touched.email ? getFieldError('email') : null
  const passwordError = touched.password ? getFieldError('password') : null
  const confirmPasswordError = touched.confirmPassword
    ? getFieldError('confirmPassword')
    : null

  /**
   * Validates the form, registers the user, and redirects into the app.
   * Failures are mapped to user-facing copy via {@link humaniseError}.
   *
   * @param event - Form submission event.
   */
  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    })
    setSubmitError(null)

    const result = signUpValidator.validate({
      name,
      email,
      password,
      confirmPassword,
    })
    if (!result.success) return

    try {
      const turnstileToken = await turnstileRef.current?.getResponse()
      await signUp.mutateAsync({
        email: email.trim(),
        password,
        name: name.trim(),
        turnstileToken,
      })
      await navigate(APP_HOME_PATH, { replace: true })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? humaniseError(error.message)
          : t('register.error'),
      )
      turnstileRef.current?.reset()
    }
  }

  return (
    <AuthShell subtitle={t('register.subtitle')}>
      <Box
        component="form"
        noValidate
        aria-label={t('register.formLabel')}
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        {submitError ? <ErrorBanner message={submitError} /> : null}

        <TextField
          id="register-name"
          name="name"
          label={t('register.name')}
          type="text"
          autoComplete="name"
          placeholder={t('register.namePlaceholder')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
          error={Boolean(nameError)}
          helperText={nameError ?? ' '}
          required
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineOutlinedIcon
                    fontSize="small"
                    aria-hidden="true"
                  />
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          id="register-email"
          name="email"
          label={t('register.email')}
          type="email"
          autoComplete="email"
          placeholder={t('register.emailPlaceholder')}
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
          id="register-password"
          name="password"
          label={t('register.password')}
          autoComplete="new-password"
          showLabel={t('register.showPassword')}
          hideLabel={t('register.hidePassword')}
          value={password}
          onChange={setPassword}
          onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
          error={Boolean(passwordError)}
          helperText={passwordError}
        />

        <PasswordField
          id="register-confirm-password"
          name="confirmPassword"
          label={t('register.confirmPassword')}
          autoComplete="new-password"
          showLabel={t('register.showConfirmPassword')}
          hideLabel={t('register.hideConfirmPassword')}
          value={confirmPassword}
          onChange={setConfirmPassword}
          onBlur={() =>
            setTouched((prev) => ({ ...prev, confirmPassword: true }))
          }
          error={Boolean(confirmPasswordError)}
          helperText={confirmPasswordError}
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
              aria-label={t('register.submitting')}
            />
          ) : (
            t('register.submit')
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
          <Typography variant="body2">{t('register.haveAccount')}</Typography>
          <Button
            type="button"
            variant="text"
            size="small"
            disabled={isLoading}
            onClick={() => navigate(authPaths.login)}
          >
            {t('register.signIn')}
          </Button>
        </Box>
      </Box>
    </AuthShell>
  )
}
