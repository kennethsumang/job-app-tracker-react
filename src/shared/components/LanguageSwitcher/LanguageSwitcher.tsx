import { useTranslation } from 'react-i18next'
import {
  isSupportedLanguage,
  supportedLanguages,
  type SupportedLanguage,
} from '@/i18n/config'
import styles from './LanguageSwitcher.module.css'

const languageLabels: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
}

/**
 * Language selector for the supported locales.
 *
 * Changing the value calls i18next, which persists the choice and updates
 * `<html lang>` through the i18n language-change listener.
 */
export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()

  const currentLanguage = isSupportedLanguage(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : supportedLanguages[0]

  return (
    <label className={styles.container}>
      <span className={styles.label}>{t('language.label')}</span>
      <select
        className={styles.select}
        value={currentLanguage}
        onChange={(event) => {
          void i18n.changeLanguage(event.target.value)
        }}
      >
        {supportedLanguages.map((language) => (
          <option key={language} value={language}>
            {languageLabels[language]}
          </option>
        ))}
      </select>
    </label>
  )
}
