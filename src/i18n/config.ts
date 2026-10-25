/**
 * i18n configuration shared by the runtime, language detection, and type
 * augmentation.
 */
export const defaultNamespace = 'common' as const
export const fallbackLanguage = 'en' as const

export const supportedLanguages = ['en', 'es'] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

/**
 * Namespaces are owned by feature modules but registered centrally so they are
 * bundled and typed. Keep this list in sync with `resources.ts`.
 */
export const namespaces = [
  'common',
  'dashboard',
  'calendar',
  'applications',
  'settings',
  'auth'
] as const
export type Namespace = (typeof namespaces)[number]

/**
 * Type guard for a supported language code.
 *
 * @param value - Candidate language code.
 * @returns True when the value is one of {@link supportedLanguages}.
 */
export function isSupportedLanguage(
  value: unknown,
): value is SupportedLanguage {
  return (
    typeof value === 'string' &&
    (supportedLanguages as readonly string[]).includes(value)
  )
}
