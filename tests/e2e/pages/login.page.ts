import { expect, type Locator, type Page } from '@playwright/test'

/** Credentials accepted by {@link LoginPage.signIn}. */
export interface LoginCredentials {
  email: string
  password: string
}

/**
 * Page object for the sign-in screen (`/`).
 *
 * Selectors are role/label based (the app ships no `data-testid` attributes),
 * which keeps them aligned with what assistive technology and users see. UI
 * copy is asserted here once, so a copy change only touches this file.
 */
export class LoginPage {
  readonly page: Page
  readonly heading: Locator
  readonly subtitle: Locator
  readonly form: Locator
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly emailHelpText: Locator
  readonly passwordHelpText: Locator
  readonly passwordToggle: Locator
  readonly submitButton: Locator
  readonly signUpButton: Locator
  readonly errorBanner: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { level: 1, name: 'Job App Tracker' })
    this.subtitle = page.getByText('Sign in to your account', { exact: true })
    this.form = page.getByRole('form', { name: 'Sign in form' })
    /* MUI appends the required asterisk to the visible label, so `getByLabel`
     * with `exact: true` does not match. The ids are the stable contract set by
     * the page component. */
    this.emailInput = page.locator('#login-email')
    this.passwordInput = page.locator('#login-password')
    this.emailHelpText = page.locator('#login-email-helper-text')
    this.passwordHelpText = page.locator('#login-password-helper-text')
    this.passwordToggle = page.getByRole('button', { name: /password$/i })
    /* The submit button is targeted by type so it stays findable while its
     * label is replaced by the "Signing in…" spinner. */
    this.submitButton = this.form.locator('button[type="submit"]')
    this.signUpButton = page.getByRole('button', { name: 'Sign up', exact: true })
    this.errorBanner = page.getByRole('alert')
  }

  /** Navigates to the login route and waits for the form to be interactive. */
  async goto(path = '/'): Promise<void> {
    await this.page.goto(path)
    await this.expectLoaded()
  }

  /** Asserts the login screen finished bootstrapping (auth session resolved). */
  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible()
    await expect(this.subtitle).toBeVisible()
    await expect(this.form).toBeVisible()
    await expect(this.emailInput).toBeVisible()
    await expect(this.passwordInput).toBeVisible()
    await expect(this.submitButton).toBeEnabled()
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email)
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password)
  }

  /** Fills both fields without submitting. */
  async fillCredentials({ email, password }: LoginCredentials): Promise<void> {
    await this.fillEmail(email)
    await this.fillPassword(password)
  }

  /** Submits the form (no implicit validation or navigation). */
  async submit(): Promise<void> {
    await this.submitButton.click()
  }

  /** Fills the form and submits it. */
  async signIn(credentials: LoginCredentials): Promise<void> {
    await this.fillCredentials(credentials)
    await this.submit()
  }

  /** Triggers client-side validation without typing anything. */
  async submitEmpty(): Promise<void> {
    await this.submit()
  }

  /** Toggles the password visibility adornment. */
  async togglePasswordVisibility(): Promise<void> {
    await this.passwordToggle.click()
  }

  /** Asserts the password input renders as plain text / masked. */
  async expectPasswordVisible(isVisible: boolean): Promise<void> {
    await expect(this.passwordInput).toHaveAttribute(
      'type',
      isVisible ? 'text' : 'password',
    )
    await expect(this.passwordToggle).toHaveAttribute(
      'aria-pressed',
      String(isVisible),
    )
  }

  /** Asserts a field-level validation message is displayed. */
  async expectEmailError(message: string): Promise<void> {
    await expect(this.emailHelpText).toHaveText(message)
    await expect(this.emailInput).toHaveAttribute('aria-invalid', 'true')
  }

  /** Asserts the email field currently has no validation message. */
  async expectNoEmailError(): Promise<void> {
    await expect(this.emailHelpText).toHaveText('')
    await expect(this.emailInput).not.toHaveAttribute('aria-invalid', 'true')
  }

  /** Asserts a field-level validation message is displayed. */
  async expectPasswordError(message: string): Promise<void> {
    await expect(this.passwordHelpText).toHaveText(message)
    await expect(this.passwordInput).toHaveAttribute('aria-invalid', 'true')
  }

  /** Asserts the password field currently has no validation message. */
  async expectNoPasswordError(): Promise<void> {
    await expect(this.passwordHelpText).toHaveText('')
    await expect(this.passwordInput).not.toHaveAttribute('aria-invalid', 'true')
  }

  /** Asserts the request-level error banner shows `message`. */
  async expectError(message: string): Promise<void> {
    await expect(this.errorBanner).toBeVisible()
    await expect(this.errorBanner).toHaveText(message)
  }

  /** Asserts no request-level error banner is rendered. */
  async expectNoError(): Promise<void> {
    await expect(this.errorBanner).toHaveCount(0)
  }

  /** Asserts the pending state: button disabled, busy and showing a spinner. */
  async expectSubmitting(): Promise<void> {
    await expect(this.submitButton).toBeDisabled()
    await expect(this.submitButton).toHaveAttribute('aria-busy', 'true')
    await expect(
      this.form.getByRole('progressbar', { name: 'Signing in…' }),
    ).toBeVisible()
  }

  /** Follows the "Sign up" link. */
  async goToRegister(): Promise<void> {
    await this.signUpButton.click()
  }
}
