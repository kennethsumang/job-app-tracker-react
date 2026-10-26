/**
 * Device-level settings derived from browser APIs.
 *
 * Mirrors the web app's `lib/device-settings.ts`: values come directly from the
 * user's device instead of a persisted settings store. Keep this module free of
 * `import.meta`/`window`-only APIs that break the CommonJS Jest transform.
 */

/**
 * Returns the device's IANA timezone (e.g. `"America/New_York"`).
 *
 * The API's interview endpoints require an explicit timezone, so this is used
 * as the default for the interview date-range queries.
 */
export function getDeviceTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}
