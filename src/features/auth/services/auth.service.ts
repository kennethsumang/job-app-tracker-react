import { authClient } from "@/features/auth/lib/auth-client";
import type {
  AuthUser,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  SignInPayload,
  SignUpPayload,
} from "@/features/auth/types";

interface ClientResult<T> {
  data: T | null;
  error: { message?: string } | null;
}

/**
 * Unwraps a better-auth client result, throwing an `Error` with the server's
 * message when the request failed so callers can surface it via `humaniseError`.
 */
function unwrap<T>(result: ClientResult<T>): T {
  if (result.error) {
    throw new Error(result.error.message ?? "Request failed");
  }
  return result.data as T;
}

/**
 * Builds the captcha header for the API's Turnstile plugin. The token is sent
 * as `X-Captcha-Response` (the header the API's CORS config allows).
 */
function captchaHeaders(
  turnstileToken?: string,
): Record<string, string> | undefined {
  return turnstileToken ? { "X-Captcha-Response": turnstileToken } : undefined;
}

/**
 * AuthService
 * Service for handling user authentication, including sign-in, sign-up,
 * sign-out, and password management. All calls go through the better-auth
 * client, which talks to the web app's `/api/auth` proxy (forwarded to the
 * API's better-auth instance). The session cookie is managed by better-auth.
 */
class AuthService {
  /**
   * Signs in a user with email and password.
   * @param   {SignInPayload} payload - The email and password credentials.
   * @returns {Promise<AuthUser>}
   */
  async signIn(payload: SignInPayload): Promise<AuthUser> {
    const data = unwrap(
      await authClient.signIn.email(
        { email: payload.email, password: payload.password },
        { headers: captchaHeaders(payload.turnstileToken) },
      ),
    );
    return data.user;
  }

  /**
   * Registers a new user account.
   * @param   {SignUpPayload} payload - The registration data including name, email, and password.
   * @returns {Promise<AuthUser>}
   */
  async signUp(payload: SignUpPayload): Promise<AuthUser> {
    const data = unwrap(
      await authClient.signUp.email(
        {
          email: payload.email,
          password: payload.password,
          name: payload.name,
        },
        { headers: captchaHeaders(payload.turnstileToken) },
      ),
    );
    return data.user;
  }

  /**
   * Signs out the currently authenticated user.
   * @returns {Promise<void>}
   */
  async signOut(): Promise<void> {
    unwrap(await authClient.signOut());
  }

  /**
   * Changes the password for the currently authenticated user.
   * @param   {ChangePasswordPayload} payload - The current and new passwords.
   * @returns {Promise<void>}
   */
  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    unwrap(
      await authClient.changePassword({
        currentPassword: payload.currentPassword,
        newPassword: payload.newPassword,
      }),
    );
  }

  /**
   * Gets the currently authenticated user's profile.
   * @returns {Promise<AuthUser | null>} The user, or `null` when not signed in.
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    const data = unwrap(await authClient.getSession());
    return data?.user ?? null;
  }

  /**
   * Requests a password reset email.
   * @param   {ForgotPasswordPayload} payload - The email address.
   * @returns {Promise<void>}
   */
  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    unwrap(
      await authClient.requestPasswordReset(
        { email: payload.email },
        { headers: captchaHeaders(payload.turnstileToken) },
      ),
    );
  }

  /**
   * Resets the password using a token from a reset email.
   * @param   {ResetPasswordPayload} payload - The token and new password.
   * @returns {Promise<void>}
   */
  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    unwrap(
      await authClient.resetPassword({
        newPassword: payload.newPassword,
        token: payload.token,
      }),
    );
  }
}

export { AuthService };
