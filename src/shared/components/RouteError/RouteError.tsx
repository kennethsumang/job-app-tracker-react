import { useTranslation } from 'react-i18next'
import { isRouteErrorResponse, useRouteError } from 'react-router'
import styles from './RouteError.module.css'

/**
 * Route-level error UI used as the router's `errorElement`.
 *
 * Shows the HTTP status for route responses and surfaces the error message in
 * development only.
 */
export function RouteError() {
  const error = useRouteError()
  const { t } = useTranslation()

  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : t('errors.unexpected.title')

  const description =
    isRouteErrorResponse(error) && error.status === 404
      ? t('errors.notFound.description')
      : t('errors.unexpected.description')

  return (
    <section className={styles.container} role="alert">
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>

      {import.meta.env.DEV &&
      !isRouteErrorResponse(error) &&
      error instanceof Error ? (
        <pre className={styles.details}>{error.message}</pre>
      ) : null}
    </section>
  )
}
