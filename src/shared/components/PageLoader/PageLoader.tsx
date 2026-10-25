import { useTranslation } from 'react-i18next'
import styles from './PageLoader.module.css'

/** Accessible full-page loading indicator. */
export function PageLoader() {
  const { t } = useTranslation()

  return (
    <div className={styles.loader} role="status" aria-live="polite">
      {t('status.loading')}
    </div>
  )
}
