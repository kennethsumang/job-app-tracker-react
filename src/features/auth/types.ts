/**
 * Shared auth payload types used by the service, hooks, validators, and forms.
 */
import type { AuthSession, AuthUser } from "@/features/auth/lib/auth-client";

/** Inferred better-auth session and user types. */
export type { AuthSession, AuthUser };

/** Auth screen mode. */
export type AuthMode = "signIn" | "signUp";

/** Credentials submitted by the login form. */
export interface SignInPayload {
  email: string;
  password: string;
  turnstileToken?: string;
}

/** Registration data submitted by the register form. */
export interface SignUpPayload {
  email: string;
  password: string;
  name: string;
  turnstileToken?: string;
}

/** Input for changing the signed-in user's password. */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/** Input for requesting a password reset email. */
export interface ForgotPasswordPayload {
  email: string;
  turnstileToken?: string;
}

/** Input for completing a password reset. */
export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}
