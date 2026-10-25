import {
  fallbackLanguage,
  isSupportedLanguage,
  type SupportedLanguage,
} from './config'

const STORAGE_KEY = 'job-app-tracker.language'

/**
 * Normalizes a BCP 47 tag (for example `es-MX`) to one of the supported
 * languages. Returns `null` when there is no usable match.
 */
export function normalizeLanguage(
  value: string | null | undefined,
): SupportedLanguage | null {
  if (!value) return null

  const normalized = value.trim().toLowerCase()
  if (!normalized) return null
  if (isSupportedLanguage(normalized)) return normalized

  const [base] = normalized.split('-')
  return isSupportedLanguage(base) ? base : null
}

function getStoredLanguage(): SupportedLanguage | null {
  if (typeof window === 'undefined') return null

  try {
    return normalizeLanguage(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
    return null
  }
}

function getPreferredLanguage(): SupportedLanguage | null {
  if (typeof navigator === 'undefined') return null

  const candidates = navigator.languages?.length
    ? navigator.languages
    : [navigator.language]

  for (const candidate of candidates) {
    const match = normalizeLanguage(candidate)
    if (match) return match
  }

  return null
}

/**
 * Resolution order: explicit user choice, browser preferences, app default.
 */
export function resolveInitialLanguage(): SupportedLanguage {
  return getStoredLanguage() ?? getPreferredLanguage() ?? fallbackLanguage
}

/**
 * Persists the chosen language when storage is available.
 *
 * @param value - Language code to store.
 */
export function persistLanguage(value: string): void {
  const language = normalizeLanguage(value)
  if (!language || typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, language)
  } catch {
    // Language still applies in-memory when persistence is unavailable.
  }
}

/**
 * Keeps `<html lang>` in sync with the active language.
 *
 * @param value - Language code to apply.
 */
export function applyDocumentLanguage(value: string): void {
  if (typeof document === 'undefined') return

  document.documentElement.lang = normalizeLanguage(value) ?? fallbackLanguage
}
