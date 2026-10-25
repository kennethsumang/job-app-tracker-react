import { useTranslation } from 'react-i18next'
import styles from './ApplicationsPage.module.css'

/** Renders the applications list (currently an empty state). */
export function ApplicationsPage() {
  const { t } = useTranslation('applications')

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{t('title')}</h1>
      <p className={styles.empty}>{t('empty')}</p>
    </section>
  )
}
