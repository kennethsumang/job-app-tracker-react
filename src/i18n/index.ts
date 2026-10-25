/**
 * i18next initialization.
 *
 * Bundles all feature translations, resolves the initial language, and keeps
 * storage and `<html lang>` in sync when the language changes.
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import {
  defaultNamespace,
  fallbackLanguage,
  namespaces,
  supportedLanguages,
} from './config'
import {
  applyDocumentLanguage,
  persistLanguage,
  resolveInitialLanguage,
} from './language'
import { resources } from './resources'

const initialLanguage = resolveInitialLanguage()

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: fallbackLanguage,
  supportedLngs: [...supportedLanguages],
  defaultNS: defaultNamespace,
  ns: [...namespaces],
  // Resources are bundled, so initialization is synchronous and `t()` is safe
  // to call on the very first render (no loading flash).
  initAsync: false,
  interpolation: {
    // React already escapes rendered values.
    escapeValue: false,
  },
  returnNull: false,
  react: {
    // No lazy-loaded translation backend, so Suspense is unnecessary.
    useSuspense: false,
  },
})

applyDocumentLanguage(initialLanguage)

i18n.on('languageChanged', (language) => {
  persistLanguage(language)
  applyDocumentLanguage(language)
})

export { i18n }
