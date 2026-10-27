import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useUserSettings } from '../hooks/use-user-settings'
import { SettingsAccountSection } from '../components/SettingsAccountSection'
import { SettingsDangerZoneSection } from '../components/SettingsDangerZoneSection'
import { SettingsPreferencesSection } from '../components/SettingsPreferencesSection'
import { SettingsSecuritySection } from '../components/SettingsSecuritySection'
import { SettingsSessionSection } from '../components/SettingsSessionSection'

/** Result message shown in the page snackbar. */
interface SnackbarState {
  open: boolean
  message: string
  error: boolean
}

/**
 * Settings page.
 *
 * Composes the account, security, preferences, session and danger-zone
 * sections. Settings loading/error state is owned by the page, while the
 * sections render their own actions and result messages.
 */
export function SettingsPage() {
  const { t } = useTranslation('settings')
  const user = useAuthStore((state) => state.user)
  const { isPending, isError } = useUserSettings()

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    error: false
  })

  function showSnackbar(message: string, error = false) {
    setSnackbar({ open: true, message, error })
  }

  function handleSnackbarClose() {
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  if (isPending) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh'
        }}
        aria-label={t('loading')}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{t('error')}</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', px: { xs: 0, sm: 2 }, py: 2 }}>
      <Typography variant="h6" sx={{ px: 2, pb: 1 }}>
        {t('title')}
      </Typography>

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <SettingsAccountSection email={user?.email ?? ''} />
        <SettingsSecuritySection onSnackbar={showSnackbar} />
        <SettingsPreferencesSection onSnackbar={showSnackbar} />
        <SettingsSessionSection />
        <SettingsDangerZoneSection onSnackbar={showSnackbar} />
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.error ? 'error' : 'success'}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
