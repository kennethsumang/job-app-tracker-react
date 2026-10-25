import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

/** Props for {@link AuthShell}. */
interface AuthShellProps {
  /** Contextual line shown under the app name. */
  subtitle: string
  /** Form content. */
  children: ReactNode
}

/**
 * Full-screen shell shared by the login and register pages.
 *
 * Mirrors the auth screen in `job-app-tracker-web`, but lives outside the app
 * layout so auth pages do not render the application navigation.
 */
export function AuthShell({ subtitle, children }: Readonly<AuthShellProps>) {
  const { t } = useTranslation()

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
        py: 4,
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <WorkOutlineRoundedIcon
            sx={{ fontSize: 64, color: 'primary.main', mb: 2 }}
            aria-hidden="true"
          />
          <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
            {t('app.name')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        </Box>

        {children}
      </Box>
    </Box>
  )
}
