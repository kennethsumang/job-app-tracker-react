import { useTranslation } from 'react-i18next'
import styles from './SettingsPage.module.css'

/** Renders the settings page (currently an empty state). */
export function SettingsPage() {
  const { t } = useTranslation('settings')

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{t('title')}</h1>
      <p className={styles.empty}>{t('empty')}</p>
    </section>
  )
}
