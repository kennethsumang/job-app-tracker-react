import { test as base, expect } from '@playwright/test'
import { AppDataApiMock } from '../mocks/app-data-api.mock'
import { AuthApiMock } from '../mocks/auth-api.mock'
import { DashboardPage } from '../pages/dashboard.page'
import { LoginPage } from '../pages/login.page'
import { RegisterPage } from '../pages/register.page'

/**
 * Custom Playwright fixtures.
 *
 * Every fixture here is installed before the first navigation, so a spec never
 * has to remember the setup order. `authApi` and `appApi` are `auto`, which
 * guarantees that no spec can accidentally reach the real backend.
 *
 * Note: the second fixture callback argument is named `provide` (Playwright's
 * docs call it `use`) because oxlint's React rule misreads `use(...)` as a hook.
 */
export interface Fixtures {
  /** Stateful mock of `/api/auth/*` (session + sign-in + sign-out). */
  authApi: AuthApiMock
  /** Mock of the read endpoints the authenticated shell loads. */
  appApi: AppDataApiMock
  /** Sign-in page object. */
  loginPage: LoginPage
  /** Registration page object. */
  registerPage: RegisterPage
  /** Authenticated dashboard page object. */
  dashboardPage: DashboardPage
}

export const test = base.extend<Fixtures>({
  authApi: [
    async ({ page }, provide) => {
      const authApi = new AuthApiMock(page)
      await authApi.install()
      await provide(authApi)
    },
    { auto: true },
  ],

  appApi: [
    async ({ page }, provide) => {
      const appApi = new AppDataApiMock(page)
      await appApi.install()
      await provide(appApi)
    },
    { auto: true },
  ],

  loginPage: async ({ page }, provide) => {
    await provide(new LoginPage(page))
  },

  registerPage: async ({ page }, provide) => {
    await provide(new RegisterPage(page))
  },

  dashboardPage: async ({ page }, provide) => {
    await provide(new DashboardPage(page))
  },
})

export { expect }
