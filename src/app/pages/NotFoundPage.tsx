import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { appPaths } from '@/features/app'
import styles from './NotFoundPage.module.css'

/** 404 page rendered inside the authenticated app shell. */
export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <section className={styles.container}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>{t('errors.notFound.title')}</h1>
      <p className={styles.description}>
        {t('errors.notFound.description')}
      </p>
      <Link className={styles.link} to={appPaths.list}>
        {t('errors.notFound.backToApplications')}
      </Link>
    </section>
  )
}
