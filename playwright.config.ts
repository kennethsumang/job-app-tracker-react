import { defineConfig, devices, type Project } from '@playwright/test'

/**
 * Playwright configuration for the Job App Tracker React app.
 *
 * The E2E suite runs against the Vite dev server and mocks every `/api`
 * request from inside the browser (see `tests/e2e/mocks`). That keeps the tests
 * deterministic, hermetic and independent from the NestJS API, its database and
 * its rate limiter, while still exercising the real router, auth provider,
 * react-query wiring and MUI rendering.
 *
 * Environment overrides:
 * - `E2E_BASE_URL`   — test an already-running deployment (disables `webServer`).
 * - `E2E_WEB_SERVER` — set to `off` to disable the managed dev server.
 * - `E2E_PORT`       — port used for the managed dev server (default 5173).
 * - `E2E_BROWSERS`   — comma-separated project list (default `chromium`).
 */
const PORT = Number(process.env.E2E_PORT ?? 5173)
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`
const IS_CI = Boolean(process.env.CI)
const MANAGE_WEB_SERVER =
  !process.env.E2E_BASE_URL && process.env.E2E_WEB_SERVER !== 'off'

/** Maps the `E2E_BROWSERS` values onto Playwright device descriptors. */
function resolveDevice(browser: string) {
  switch (browser) {
    case 'firefox':
      return devices['Desktop Firefox']
    case 'webkit':
      return devices['Desktop Safari']
    default:
      return devices['Desktop Chrome']
  }
}

const BROWSERS = (process.env.E2E_BROWSERS ?? 'chromium')
  .split(',')
  .map((browser) => browser.trim())
  .filter(Boolean)

const projects: Project[] = BROWSERS.map((browser) => ({
  name: browser,
  use: { ...resolveDevice(browser) },
}))

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  /* Every spec gets an isolated browser context, so specs are safe to parallelise. */
  fullyParallel: true,
  /* Fail the build on CI if `test.only` was left in the source code. */
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  workers: IS_CI ? 2 : undefined,
  /* Artifacts are git-ignored (see .gitignore). */
  outputDir: './test-results',
  reporter: IS_CI
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : [['html', { open: 'never' }], ['list']],
  globalSetup: './tests/e2e/global-setup.ts',
  /* Auth flows are UI-driven; a 5s UI assertion budget keeps failures fast. */
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: BASE_URL,
    /* Pin locale/timezone: the app derives its language from `navigator` and
     * renders dayjs/Intl formatted dates, so an unpinned environment could
     * render Spanish copy or shift interview times. */
    locale: 'en-US',
    timezoneId: 'UTC',
    /* Fail fast on hung selectors, but allow slow first paint in dev. */
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects,
  webServer: MANAGE_WEB_SERVER
    ? {
        command: `yarn dev --port ${PORT} --strictPort`,
        url: BASE_URL,
        reuseExistingServer: !IS_CI,
        timeout: 120_000,
        stdout: 'pipe',
        stderr: 'pipe',
      }
    : undefined,
})
