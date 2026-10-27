import type { Page, Route } from '@playwright/test'
import { delay, fulfillApiError, fulfillEnvelope, readJsonBody } from './http'

/**
 * In-browser mock of the settings and account endpoints the settings page
 * talks to.
 *
 * Endpoints covered:
 * - `GET    /api/settings` → the user settings record
 * - `PATCH  /api/settings` → update settings (recorded, stateful)
 * - `DELETE /api/users/me`  → account deletion (returns 204, recorded)
 */

/** Subset of the API `UserSettings` contract used by the fixtures. */
export interface MockSettings {
  language: string
  defaultCurrency: string
  emailNotifications: boolean
}

/** Failure the mock returns instead of endpoint data. */
export type SettingsFailure =
  | { status: number; message: string }
  | 'network-error'

/** Body of `PATCH /api/settings` as sent by the client. */
export interface RecordedSettingsUpdate {
  language?: string
  defaultCurrency?: string
  emailNotifications?: boolean
}

export const DEFAULT_SETTINGS: MockSettings = {
  language: 'en',
  defaultCurrency: 'USD',
  emailNotifications: true,
}

export interface SettingsApiMockOptions {
  settings?: MockSettings
  /** Artificial latency for every response, to observe loading states. */
  latencyMs?: number
}

export class SettingsApiMock {
  private readonly page: Page
  private settingsData: MockSettings
  private latencyMs: number
  private settingsFailure: SettingsFailure | null = null
  private updateFailure: SettingsFailure | null = null

  /** Every `PATCH /api/settings` request the mock received, in order. */
  readonly updateRequests: RecordedSettingsUpdate[] = []

  /** Number of `DELETE /api/users/me` calls. */
  deleteAccountCalls = 0

  constructor(page: Page, options: SettingsApiMockOptions = {}) {
    this.page = page
    this.settingsData = options.settings ?? DEFAULT_SETTINGS
    this.latencyMs = options.latencyMs ?? 0
  }

  /** Settings currently served by the mock. */
  get settings(): MockSettings {
    return this.settingsData
  }

  /** Registers the route handlers. Must run before the first navigation. */
  async install(): Promise<void> {
    await this.page.route('**/api/settings**', (route) =>
      this.handleSettings(route),
    )
    await this.page.route('**/api/users/me', (route) => this.handleUsers(route))
  }

  /** Replaces the seeded settings. Call before navigating. */
  setSettings(settings: MockSettings): void {
    this.settingsData = settings
  }

  /** Adds latency to every response so loading states stay observable. */
  setLatency(latencyMs: number): void {
    this.latencyMs = latencyMs
  }

  /** Makes `GET /api/settings` fail. */
  failSettings(failure: SettingsFailure): void {
    this.settingsFailure = failure
  }

  /** Makes `PATCH /api/settings` fail. */
  failUpdateSettings(failure: SettingsFailure): void {
    this.updateFailure = failure
  }

  private async handleSettings(route: Route): Promise<void> {
    const method = route.request().method()

    await this.wait()

    if (method === 'PATCH') {
      const payload = readJsonBody<RecordedSettingsUpdate>(route)
      this.updateRequests.push(payload)

      if (this.updateFailure) {
        await this.respondWithFailure(route, this.updateFailure)
        return
      }

      this.settingsData = { ...this.settingsData, ...payload }
      await fulfillEnvelope(route, this.settingsData)
      return
    }

    if (method !== 'GET') {
      await fulfillApiError(
        route,
        501,
        `No settings mock registered for ${method}`,
      )
      return
    }

    if (this.settingsFailure) {
      await this.respondWithFailure(route, this.settingsFailure)
      return
    }

    await fulfillEnvelope(route, this.settingsData)
  }

  private async handleUsers(route: Route): Promise<void> {
    const method = route.request().method()

    if (method === 'DELETE') {
      this.deleteAccountCalls += 1
      // The API responds with 204 No Content for a successful deletion.
      await route.fulfill({ status: 204, body: '' })
      return
    }

    await fulfillApiError(
      route,
      501,
      `No users mock registered for ${method}`,
    )
  }

  private async respondWithFailure(
    route: Route,
    failure: SettingsFailure,
  ): Promise<void> {
    if (failure === 'network-error') {
      await route.abort('connectionrefused')
      return
    }

    await fulfillApiError(route, failure.status, failure.message)
  }

  private async wait(): Promise<void> {
    if (this.latencyMs > 0) {
      await delay(this.latencyMs)
    }
  }
}
