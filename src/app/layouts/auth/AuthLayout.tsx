import { Outlet } from 'react-router'
import styles from './AuthLayout.module.css'

/**
 * Layout for the public authentication routes.
 *
 * Auth screens render their own full-screen shell (`AuthShell`), so this layout
 * only provides the skip-link target and the router outlet. Redirecting
 * already-authenticated users away from these screens is handled by each page.
 */
export function AuthLayout() {
  return (
    <div className={styles.root} id="main-content" tabIndex={-1}>
      <Outlet />
    </div>
  )
}
