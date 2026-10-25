import type { TranslationResources } from '../resources'

/**
 * Makes translation keys type-safe:
 *
 *   t('navigation.home')        // ✅ known key
 *   t('navigation.homee')       // ❌ compile-time error
 *
 * Namespaces are inferred from `resources.en`, so adding a feature namespace
 * automatically adds its keys here.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: TranslationResources
  }
}
