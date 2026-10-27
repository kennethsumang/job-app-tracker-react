import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { authPaths } from '@/features/auth'
import { useChangePassword } from '@/features/auth/hooks/use-auth'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { ChangePasswordDialog } from './ChangePasswordDialog'

/** Props for {@link SettingsSecuritySection}. */
interface SettingsSecuritySectionProps {
  /** Shows a result snackbar (message, optional error). */
  onSnackbar: (message: string, error?: boolean) => void
}

/** Security actions (currently the change-password flow). */
export function SettingsSecuritySection({
  onSnackbar
}: Readonly<SettingsSecuritySectionProps>) {
  const { t } = useTranslation('settings')
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const changePasswordMutation = useChangePassword()
  const clearSession = useAuthStore((state) => state.clearSession)

  async function handleChangePassword(
    currentPassword: string,
    newPassword: string
  ) {
    try {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword })
      setDialogOpen(false)
      clearSession()
      onSnackbar(t('security.passwordUpdated'))
      void navigate(authPaths.login)
    } catch {
      onSnackbar(t('security.passwordUpdateFailed'), true)
    }
  }

  return (
    <>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ px: 2, pt: 2, display: 'block' }}
      >
        {t('security.heading')}
      </Typography>
      <List disablePadding>
        <ListItemButton
          onClick={() => setDialogOpen(true)}
          disabled={changePasswordMutation.isPending}
        >
          <ListItemIcon>
            <LockOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary={t('security.changePassword')} />
          <ChevronRightIcon color="action" />
        </ListItemButton>
      </List>
      <Divider sx={{ mx: 2 }} />
      <ChangePasswordDialog
        open={dialogOpen}
        isSubmitting={changePasswordMutation.isPending}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleChangePassword}
      />
    </>
  )
}
