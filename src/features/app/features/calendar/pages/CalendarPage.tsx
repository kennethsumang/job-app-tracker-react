import { useTranslation } from 'react-i18next'
import styles from './CalendarPage.module.css'

/** Renders the calendar (currently an empty state). */
export function CalendarPage() {
  const { t } = useTranslation('calendar')

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{t('title')}</h1>
      <p className={styles.empty}>{t('empty')}</p>
    </section>
  )
}
