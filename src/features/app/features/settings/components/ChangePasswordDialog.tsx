import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChangePasswordValidator } from '../validators/change-password.validator'

const changePasswordValidator = new ChangePasswordValidator()

/** Props for {@link ChangePasswordDialog}. */
interface ChangePasswordDialogProps {
  /** Whether the dialog is visible. */
  open: boolean
  /** True while the change-password mutation is running. */
  isSubmitting: boolean
  /** Dismisses the dialog without changing the password. */
  onClose: () => void
  /** Submits the validated passwords. */
  onSubmit: (currentPassword: string, newPassword: string) => void
}

/**
 * Form dialog for changing the signed-in user's password.
 */
export function ChangePasswordDialog({
  open,
  isSubmitting,
  onClose,
  onSubmit
}: Readonly<ChangePasswordDialogProps>) {
  const { t } = useTranslation('settings')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const result = changePasswordValidator.validate({
      currentPassword,
      newPassword,
      confirmPassword
    })
    if (result.success) {
      setErrors({})
      return true
    }

    const next: Record<string, string> = {}
    for (const [field, messages] of Object.entries(result.errors)) {
      if (messages.length) next[field] = messages[0]
    }
    setErrors(next)
    return false
  }

  function handleSubmit() {
    if (!validate()) return
    onSubmit(currentPassword, newPassword)
  }

  function handleClose() {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setErrors({})
    setShowCurrent(false)
    setShowNew(false)
    setShowConfirm(false)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('changePassword.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label={t('changePassword.currentPassword')}
            type={showCurrent ? 'text' : 'password'}
            fullWidth
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            error={!!errors.currentPassword}
            helperText={errors.currentPassword}
            disabled={isSubmitting}
            slotProps={{
              input: {
                endAdornment: (
                  <IconButton
                    aria-label={t('changePassword.toggleCurrentPassword')}
                    onClick={() => setShowCurrent((value) => !value)}
                    edge="end"
                  >
                    {showCurrent ? (
                      <VisibilityOffOutlinedIcon />
                    ) : (
                      <VisibilityOutlinedIcon />
                    )}
                  </IconButton>
                )
              }
            }}
          />
          <TextField
            label={t('changePassword.newPassword')}
            type={showNew ? 'text' : 'password'}
            fullWidth
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            error={!!errors.newPassword}
            helperText={errors.newPassword}
            disabled={isSubmitting}
            slotProps={{
              input: {
                endAdornment: (
                  <IconButton
                    aria-label={t('changePassword.toggleNewPassword')}
                    onClick={() => setShowNew((value) => !value)}
                    edge="end"
                  >
                    {showNew ? (
                      <VisibilityOffOutlinedIcon />
                    ) : (
                      <VisibilityOutlinedIcon />
                    )}
                  </IconButton>
                )
              }
            }}
          />
          <TextField
            label={t('changePassword.confirmPassword')}
            type={showConfirm ? 'text' : 'password'}
            fullWidth
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            disabled={isSubmitting}
            slotProps={{
              input: {
                endAdornment: (
                  <IconButton
                    aria-label={t('changePassword.toggleConfirmPassword')}
                    onClick={() => setShowConfirm((value) => !value)}
                    edge="end"
                  >
                    {showConfirm ? (
                      <VisibilityOffOutlinedIcon />
                    ) : (
                      <VisibilityOutlinedIcon />
                    )}
                  </IconButton>
                )
              }
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          {t('changePassword.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? t('changePassword.saving') : t('changePassword.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
