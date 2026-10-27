import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined'
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
import { useDeleteAllUserData } from '../hooks/use-user-settings'

/** Props for {@link SettingsDangerZoneSection}. */
interface SettingsDangerZoneSectionProps {
  /** Shows a result snackbar (message, optional error). */
  onSnackbar: (message: string, error?: boolean) => void
}

/** Account deletion with a hard-to-miss confirmation. */
export function SettingsDangerZoneSection({
  onSnackbar
}: Readonly<SettingsDangerZoneSectionProps>) {
  const { t } = useTranslation('settings')
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const deleteAllUserDataMutation = useDeleteAllUserData()
  const signOutMutation = useSignOut()

  async function handleDeleteAllUserData() {
    try {
      await deleteAllUserDataMutation.mutateAsync()
    } catch {
      onSnackbar(t('dangerZone.deleteFailed'), true)
      setConfirmOpen(false)
      return
    }

    // The account (and its sessions) are gone server-side now, so the
    // follow-up sign-out can fail. Attempt it but don't block the redirect.
    try {
      await signOutMutation.mutateAsync()
    } catch {
      // Session already deleted server-side.
    }
    void navigate(authPaths.login)
  }

  const isPending =
    deleteAllUserDataMutation.isPending || signOutMutation.isPending

  return (
    <>
      <Typography
        variant="overline"
        color="error"
        sx={{ px: 2, pt: 2, display: 'block' }}
      >
        {t('dangerZone.heading')}
      </Typography>
      <List disablePadding>
        <ListItemButton
          onClick={() => setConfirmOpen(true)}
          disabled={isPending}
        >
          <ListItemIcon>
            <DeleteForeverOutlinedIcon color="error" />
          </ListItemIcon>
          <ListItemText
            primary={t('dangerZone.deleteAllData')}
            secondary={t('dangerZone.deleteAllDataDescription')}
            slotProps={{ primary: { color: 'error' } }}
          />
        </ListItemButton>
      </List>

      <Dialog
        open={confirmOpen}
        onClose={() => !isPending && setConfirmOpen(false)}
        aria-labelledby="delete-data-dialog-title"
      >
        <DialogTitle id="delete-data-dialog-title">
          {t('dangerZone.deleteConfirmTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('dangerZone.deleteConfirmBody')}{' '}
            <strong>{t('dangerZone.deleteConfirmWarning')}</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={isPending}>
            {t('dangerZone.cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAllUserData}
            disabled={isPending}
          >
            {isPending
              ? t('dangerZone.deleting')
              : t('dangerZone.deleteEverything')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
