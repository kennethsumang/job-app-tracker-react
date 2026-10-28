import { test as base, expect } from '@playwright/test'
import { AppDataApiMock } from '../mocks/app-data-api.mock'
import { SettingsApiMock } from '../mocks/settings-api.mock'
import { AuthApiMock } from '../mocks/auth-api.mock'
import { ApplicationDetailPage } from '../pages/application-detail.page'
import { ApplicationFormDialogPage } from '../pages/application-form-dialog.page'
import { AddApplicationDialogPage } from '../pages/add-application-dialog.page'
import { ApplicationsListPage } from '../pages/applications-list.page'
import { CalendarPage } from '../pages/calendar.page'
import { DashboardPage } from '../pages/dashboard.page'
import { DeleteApplicationDialogPage } from '../pages/delete-application-dialog.page'
import { InterviewFormDialogPage } from '../pages/interview-form-dialog.page'
import { LoginPage } from '../pages/login.page'
import { RegisterPage } from '../pages/register.page'
import { SettingsPage } from '../pages/settings.page'
import { StatusChangeDialogPage } from '../pages/status-change-dialog.page'

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
  /** Mock of the settings and account endpoints the settings page talks to. */
  settingsApi: SettingsApiMock
  /** Sign-in page object. */
  loginPage: LoginPage
  /** Registration page object. */
  registerPage: RegisterPage
  /** Authenticated dashboard page object. */
  dashboardPage: DashboardPage
  /** Applications list page object. */
  applicationsListPage: ApplicationsListPage
  /** Single-application detail page object. */
  applicationDetailPage: ApplicationDetailPage
  /** Two-step create/edit form dialog (edit mode). */
  applicationFormDialog: ApplicationFormDialogPage
  /** Soft-delete confirmation dialog. */
  deleteApplicationDialog: DeleteApplicationDialogPage
  /** Status-change dialog. */
  statusChangeDialog: StatusChangeDialogPage
  /** Interview form dialog (create mode). */
  interviewFormDialog: InterviewFormDialogPage
  /** Settings page object. */
  settingsPage: SettingsPage
  /** "Add Application" dialog opened from the dashboard. */
  addApplicationDialog: AddApplicationDialogPage
  /** Authenticated calendar page object. */
  calendarPage: CalendarPage
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

  settingsApi: [
    async ({ page }, provide) => {
      const settingsApi = new SettingsApiMock(page)
      await settingsApi.install()
      await provide(settingsApi)
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

  applicationsListPage: async ({ page }, provide) => {
    await provide(new ApplicationsListPage(page))
  },

  applicationDetailPage: async ({ page }, provide) => {
    await provide(new ApplicationDetailPage(page))
  },

  applicationFormDialog: async ({ page }, provide) => {
    await provide(new ApplicationFormDialogPage(page))
  },

  deleteApplicationDialog: async ({ page }, provide) => {
    await provide(new DeleteApplicationDialogPage(page))
  },

  statusChangeDialog: async ({ page }, provide) => {
    await provide(new StatusChangeDialogPage(page))
  },

  interviewFormDialog: async ({ page }, provide) => {
    await provide(new InterviewFormDialogPage(page))
  },

  settingsPage: async ({ page }, provide) => {
    await provide(new SettingsPage(page))
  },

  addApplicationDialog: async ({ page }, provide) => {
    await provide(new AddApplicationDialogPage(page))
  },

  calendarPage: async ({ page }, provide) => {
    await provide(new CalendarPage(page))
  },
})

export { expect }
