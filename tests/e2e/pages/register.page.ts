import { expect, type Locator, type Page } from '@playwright/test'

/** Values accepted by {@link RegisterPage.signUp}. */
export interface RegistrationInput {
  name: string
  email: string
  password: string
  /** Defaults to `password` so specs only pass it when testing mismatches. */
  confirmPassword?: string
}

/**
 * Page object for the account registration screen (`/auth/register`).
 *
 * Inputs are located by id because MUI appends the required asterisk to the
 * visible label, which breaks `getByLabel(..., { exact: true })`.
 */
export class RegisterPage {
  readonly page: Page
  readonly heading: Locator
  readonly subtitle: Locator
  readonly form: Locator
  readonly nameInput: Locator
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly confirmPasswordInput: Locator
  readonly nameHelpText: Locator
  readonly emailHelpText: Locator
  readonly passwordHelpText: Locator
  readonly confirmPasswordHelpText: Locator
  readonly passwordToggle: Locator
  readonly confirmPasswordToggle: Locator
  readonly submitButton: Locator
  readonly signInButton: Locator
  readonly errorBanner: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { level: 1, name: 'Job App Tracker' })
    this.subtitle = page.getByText('Create an account to get started', {
      exact: true,
    })
    this.form = page.getByRole('form', { name: 'Create account form' })
    this.nameInput = page.locator('#register-name')
    this.emailInput = page.locator('#register-email')
    this.passwordInput = page.locator('#register-password')
    this.confirmPasswordInput = page.locator('#register-confirm-password')
    this.nameHelpText = page.locator('#register-name-helper-text')
    this.emailHelpText = page.locator('#register-email-helper-text')
    this.passwordHelpText = page.locator('#register-password-helper-text')
    this.confirmPasswordHelpText = page.locator(
      '#register-confirm-password-helper-text',
    )
    /* The toggles flip between "Show …" and "Hide …" labels. */
    this.passwordToggle = page.getByRole('button', {
      name: /^(Show|Hide) password$/,
    })
    this.confirmPasswordToggle = page.getByRole('button', {
      name: /^(Show|Hide) confirm password$/,
    })
    this.submitButton = this.form.locator('button[type="submit"]')
    this.signInButton = page.getByRole('button', { name: 'Sign in', exact: true })
    this.errorBanner = page.getByRole('alert')
  }

  /** Navigates to the registration route and waits for the form. */
  async goto(path = '/auth/register'): Promise<void> {
    await this.page.goto(path)
    await this.expectLoaded()
  }

  /** Asserts the registration screen finished bootstrapping. */
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/auth\/register$/)
    await expect(this.heading).toBeVisible()
    await expect(this.subtitle).toBeVisible()
    await expect(this.form).toBeVisible()
    await expect(this.nameInput).toBeVisible()
    await expect(this.emailInput).toBeVisible()
    await expect(this.passwordInput).toBeVisible()
    await expect(this.confirmPasswordInput).toBeVisible()
    await expect(this.submitButton).toBeEnabled()
  }

  /** Fills every field without submitting. */
  async fillForm({
    name,
    email,
    password,
    confirmPassword,
  }: RegistrationInput): Promise<void> {
    await this.nameInput.fill(name)
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.confirmPasswordInput.fill(confirmPassword ?? password)
  }

  /** Submits the form (no implicit validation or navigation). */
  async submit(): Promise<void> {
    await this.submitButton.click()
  }

  /** Fills the form and submits it. */
  async signUp(input: RegistrationInput): Promise<void> {
    await this.fillForm(input)
    await this.submit()
  }

  /** Triggers client-side validation without typing anything. */
  async submitEmpty(): Promise<void> {
    await this.submit()
  }

  /** Toggles visibility of the password field. */
  async togglePasswordVisibility(): Promise<void> {
    await this.passwordToggle.click()
  }

  /** Toggles visibility of the confirm-password field. */
  async toggleConfirmPasswordVisibility(): Promise<void> {
    await this.confirmPasswordToggle.click()
  }

  /** Asserts the password input renders as plain text / masked. */
  async expectPasswordVisible(isVisible: boolean): Promise<void> {
    await expect(this.passwordInput).toHaveAttribute(
      'type',
      isVisible ? 'text' : 'password',
    )
  }

  /** Asserts the confirm-password input renders as plain text / masked. */
  async expectConfirmPasswordVisible(isVisible: boolean): Promise<void> {
    await expect(this.confirmPasswordInput).toHaveAttribute(
      'type',
      isVisible ? 'text' : 'password',
    )
  }

  async expectNameError(message: string): Promise<void> {
    await expect(this.nameHelpText).toHaveText(message)
    await expect(this.nameInput).toHaveAttribute('aria-invalid', 'true')
  }

  async expectEmailError(message: string): Promise<void> {
    await expect(this.emailHelpText).toHaveText(message)
    await expect(this.emailInput).toHaveAttribute('aria-invalid', 'true')
  }

  async expectPasswordError(message: string): Promise<void> {
    await expect(this.passwordHelpText).toHaveText(message)
    await expect(this.passwordInput).toHaveAttribute('aria-invalid', 'true')
  }

  async expectConfirmPasswordError(message: string): Promise<void> {
    await expect(this.confirmPasswordHelpText).toHaveText(message)
    await expect(this.confirmPasswordInput).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  }

  async expectNoConfirmPasswordError(): Promise<void> {
    await expect(this.confirmPasswordHelpText).toHaveText('')
    await expect(this.confirmPasswordInput).not.toHaveAttribute(
      'aria-invalid',
      'true',
    )
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
      this.form.getByRole('progressbar', { name: 'Creating account…' }),
    ).toBeVisible()
  }

  /** Follows the "Sign in" link back to the login screen. */
  async goToSignIn(): Promise<void> {
    await this.signInButton.click()
  }
}
