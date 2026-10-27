import LogoutIcon from '@mui/icons-material/Logout'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { authPaths } from '@/features/auth'
import { useSignOut } from '@/features/auth/hooks/use-auth'

/** Sign-out action with confirmation. */
export function SettingsSessionSection() {
  const { t } = useTranslation('settings')
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const signOutMutation = useSignOut()

  async function handleSignOut() {
    await signOutMutation.mutateAsync()
    void navigate(authPaths.login)
  }

  return (
    <>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ px: 2, pt: 2, display: 'block' }}
      >
        {t('session.heading')}
      </Typography>
      <List disablePadding>
        <ListItemButton
          onClick={() => setConfirmOpen(true)}
          disabled={signOutMutation.isPending}
        >
          <ListItemIcon>
            <LogoutIcon color="error" />
          </ListItemIcon>
          <ListItemText
            primary={t('session.signOut')}
            slotProps={{ primary: { color: 'error' } }}
          />
        </ListItemButton>
      </List>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        aria-labelledby="sign-out-dialog-title"
      >
        <DialogTitle id="sign-out-dialog-title">
          {t('session.signOutConfirmTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{t('session.signOutConfirmBody')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmOpen(false)}
            disabled={signOutMutation.isPending}
          >
            {t('session.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSignOut}
            disabled={signOutMutation.isPending}
          >
            {signOutMutation.isPending
              ? t('session.signingOut')
              : t('session.signOut')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
