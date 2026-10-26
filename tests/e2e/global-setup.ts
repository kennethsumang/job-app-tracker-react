import { chromium } from '@playwright/test'

/**
 * Global setup for the E2E suite.
 *
 * Responsibilities (kept deliberately small — per-test state belongs in
 * fixtures, not here):
 *
 * 1. Fail fast with an actionable error when the app under test is not
 *    reachable, instead of letting every spec time out.
 * 2. Warm the Vite module graph once. The first request to the dev server
 *    triggers dependency pre-bundling and a possible page reload, which can
 *    race the first assertions of a spec (the infamous "Invalid hook call"
 *    transient). Serving one full page load here removes that flake.
 *
 * No auth storage state is produced on purpose: the API is mocked inside the
 * browser, so cookies written to a storage-state file would be meaningless.
 * Tests start from a clean, anonymous session and opt into authentication
 * through the `authApi` fixture.
 */

const READY_TIMEOUT_MS = Number(process.env.E2E_READY_TIMEOUT_MS ?? 60_000)
const POLL_INTERVAL_MS = 500

/** Minimal response contract we need from the app shell. */
interface WarmupResult {
  status: number
  html: string
}

/**
 * Polls the base URL until it answers, so a slow container can start without
 * producing a confusing failure.
 *
 * @param url - The base URL configured for Playwright.
 * @returns The first successful response.
 */
async function waitForApp(url: string): Promise<WarmupResult> {
  const deadline = Date.now() + READY_TIMEOUT_MS
  let lastError = 'unknown error'

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: 'follow' })
      if (response.ok) {
        return { status: response.status, html: await response.text() }
      }
      lastError = `HTTP ${response.status}`
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }

  throw new Error(
    `The app under test is not reachable at ${url} (${lastError}).\n` +
      'Start it with `yarn dev` or let Playwright manage it via the `webServer` option.',
  )
}

export default async function globalSetup(): Promise<void> {
  const baseUrl = process.env.E2E_BASE_URL ?? `http://localhost:${process.env.E2E_PORT ?? 5173}`
  const { html } = await waitForApp(baseUrl)

  if (!html.includes('id="root"')) {
    throw new Error(
      `${baseUrl} responded but does not look like the Job App Tracker SPA (missing #root).`,
    )
  }

  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ baseURL: baseUrl, locale: 'en-US' })

    // Answer the bootstrap session probe so warm-up never touches the real API.
    await page.route('**/api/**', (route) => route.fulfill({ status: 200, body: 'null' }))

    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.locator('#root').waitFor()
    await page.getByRole('heading', { level: 1, name: 'Job App Tracker' }).waitFor()
  } finally {
    await browser.close()
  }
}
