/**
 * Formats an ISO timestamp in an explicit IANA timezone.
 *
 * The timezone is always passed to `Intl.DateTimeFormat` (rather than relying on
 * the runtime default) so the output is deterministic and matches the user's
 * device timezone when `timeZone` is `getDeviceTimezone()`.
 *
 * @param   {string} value - ISO 8601 timestamp.
 * @param   {string} timeZone - IANA timezone name (e.g. `Europe/Madrid`).
 * @param   {string} locale - BCP 47 locale used for month/day names.
 * @returns {string | null} The formatted date and time, or `null` for invalid input/zone.
 */
export function formatDateTimeInTimeZone(
  value: string,
  timeZone: string,
  locale: string
): string | null {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone
    }).format(new Date(value))
  } catch {
    return null
  }
}
