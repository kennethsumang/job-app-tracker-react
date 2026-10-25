/**
 * Maps raw auth/API error messages to user-facing copy.
 *
 * Mirrors `job-app-tracker-web/lib/auth-errors.ts`. Business logic that calls
 * the auth service should run errors through this before displaying them.
 */
export function humaniseError(message: string): string {
  const lower = message.toLowerCase()
  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid email or password') ||
    lower.includes('invalid credentials')
  ) {
    return 'Incorrect email or password.'
  }
  if (
    lower.includes('user already registered') ||
    lower.includes('user already exists') ||
    lower.includes('already exists') ||
    lower.includes('already registered')
  ) {
    return 'An account already exists with this email.'
  }
  if (
    lower.includes('refresh token has expired') ||
    lower.includes('invalid refresh token') ||
    lower.includes('token reuse detected')
  ) {
    return 'Your session has expired. Please sign in again.'
  }
  if (lower.includes('current password is incorrect')) {
    return 'Your current password is incorrect.'
  }
  if (lower.includes('invalid or expired reset token')) {
    return 'This password reset link is invalid or has expired. Please request a new one.'
  }
  if (lower.includes('captcha verification failed')) {
    return 'Security verification failed. Please try again.'
  }
  if (lower.includes('validation failed')) {
    return 'Please check your input and try again.'
  }
  if (lower.includes('password') && lower.includes('least')) {
    return 'Password must be at least 8 characters.'
  }
  if (lower.includes('invalid email')) {
    return 'Please enter a valid email address.'
  }
  if (lower.includes('email is not verified')) {
    return 'Please verify your email address before signing in.'
  }
  if (lower.includes('user not found')) {
    return 'No account found with this email.'
  }
  if (
    lower.includes('too many') ||
    lower.includes('rate limit') ||
    lower.includes('throttled')
  ) {
    return 'Too many attempts. Please try again later.'
  }
  // Fallback: never expose raw backend error messages to the end user.
  return 'An unexpected error occurred. Please try again.'
}
