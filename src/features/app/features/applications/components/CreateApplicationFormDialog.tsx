import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EMPLOYMENT_TYPES, WORKPLACE_TYPES } from '../constants'
import type {
  CreateApplicationPayload,
  EmploymentType,
  WorkplaceType
} from '../services/applications.service'

/** Field name to validation message. */
type FormErrors = Partial<Record<'companyName' | 'positionTitle', string>>

/** Props for {@link CreateApplicationFormDialog}. */
interface CreateApplicationFormDialogProps {
  /** Whether the dialog is visible. */
  open: boolean
  /** Closes the dialog without saving. */
  onClose: () => void
  /** Persists the payload; the dialog closes when it resolves. */
  onSubmit: (payload: CreateApplicationPayload) => Promise<void>
}

/**
 * Compact one-step dialog for quickly adding a new application.
 *
 * Only the required basics (company and position) are collected; the
 * application is created with the `DRAFT` status. The form state is
 * initialised on mount, so the caller must remount it (via `key`) for every
 * dialog opening.
 */
export function CreateApplicationFormDialog({
  open,
  onClose,
  onSubmit
}: Readonly<CreateApplicationFormDialogProps>) {
  const { t } = useTranslation('applications')
  const titleId = useId()

  const [companyName, setCompanyName] = useState('')
  const [positionTitle, setPositionTitle] = useState('')
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>('')
  const [workplaceType, setWorkplaceType] = useState<WorkplaceType | ''>('')

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!companyName.trim()) {
      errs.companyName = t('form.errors.companyName')
    }
    if (!positionTitle.trim()) {
      errs.positionTitle = t('form.errors.positionTitle')
    }
    return errs
  }

  async function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setErrors({})
    setIsSubmitting(true)
    try {
      await onSubmit({
        companyName: companyName.trim(),
        positionTitle: positionTitle.trim(),
        status: 'DRAFT',
        employmentType: employmentType || undefined,
        workplaceType: workplaceType || undefined
      })
      onClose()
    } catch {
      // Keep the dialog open (and the input intact) so the user can retry;
      // the caller is responsible for surfacing the error.
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby={titleId}
    >
      <DialogTitle id={titleId} sx={{ pb: 1 }}>
        {t('form.createTitle')}
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label={t('form.fields.companyName')}
              placeholder={t('form.fields.companyNamePlaceholder')}
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              error={Boolean(errors.companyName)}
              helperText={errors.companyName ?? ' '}
              required
              fullWidth
              autoFocus
            />
            <TextField
              label={t('form.fields.positionTitle')}
              placeholder={t('form.fields.positionTitlePlaceholder')}
              value={positionTitle}
              onChange={(event) => setPositionTitle(event.target.value)}
              error={Boolean(errors.positionTitle)}
              helperText={errors.positionTitle ?? ' '}
              required
              fullWidth
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              select
              label={t('form.fields.employmentType')}
              value={employmentType}
              onChange={(event) =>
                setEmploymentType(event.target.value as EmploymentType | '')
              }
              fullWidth
            >
              <MenuItem value="">{t('form.fields.none')}</MenuItem>
              {EMPLOYMENT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {t(`employmentTypes.${type}`)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={t('form.fields.workplaceType')}
              value={workplaceType}
              onChange={(event) =>
                setWorkplaceType(event.target.value as WorkplaceType | '')
              }
              fullWidth
            >
              <MenuItem value="">{t('form.fields.none')}</MenuItem>
              {WORKPLACE_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {t(`workplaceTypes.${type}`)}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>
      </DialogContent>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          px: 3,
          pb: 2,
          pt: 1
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            {t('form.actions.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              t('form.actions.create')
            )}
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
