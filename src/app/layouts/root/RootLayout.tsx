import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'
import styles from './RootLayout.module.css'

/**
 * Root layout rendered for every route.
 *
 * Owns only the document-level shell and the skip link; authentication guards
 * and navigation chrome live in `AuthLayout` and `AppLayout`.
 */
export function RootLayout() {
  const { t } = useTranslation()

  return (
    <div className={styles.root}>
      <a className={styles.skipLink} href="#main-content">
        {t('navigation.skipToContent')}
      </a>
      <Outlet />
    </div>
  )
}
