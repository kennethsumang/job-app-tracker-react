import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { useTranslation } from 'react-i18next'

/** Props for {@link DeleteConfirmationDialog}. */
interface DeleteConfirmationDialogProps {
  /** Whether the dialog is visible. */
  open: boolean
  /** Company name shown in the confirmation text. */
  companyName: string
  /** Confirms the deletion. */
  onConfirm: () => void
  /** Dismisses the dialog without deleting. */
  onCancel: () => void
  /** When true, warns that the deletion cannot be undone. */
  isPermanent?: boolean
}

/**
 * Confirmation dialog for soft- and permanently deleting an application.
 */
export function DeleteConfirmationDialog({
  open,
  companyName,
  onConfirm,
  onCancel,
  isPermanent = false
}: Readonly<DeleteConfirmationDialogProps>) {
  const { t } = useTranslation('applications')

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>
        {isPermanent
          ? t('deleteDialog.permanentTitle')
          : t('deleteDialog.title')}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {isPermanent
            ? t('deleteDialog.permanentBody', { company: companyName })
            : t('deleteDialog.body', { company: companyName })}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t('deleteDialog.cancel')}</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          {isPermanent
            ? t('deleteDialog.permanentConfirm')
            : t('deleteDialog.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
