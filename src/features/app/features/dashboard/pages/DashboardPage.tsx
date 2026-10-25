import { useTranslation } from 'react-i18next'
import styles from './DashboardPage.module.css'

/** Renders the dashboard (currently an empty state). */
export function DashboardPage() {
  const { t } = useTranslation('dashboard')

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{t('title')}</h1>
      <p className={styles.empty}>{t('empty')}</p>
    </section>
  )
}
