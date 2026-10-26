import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Step from '@mui/material/Step'
import StepButton from '@mui/material/StepButton'
import Stepper from '@mui/material/Stepper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  COMMON_CURRENCIES,
  DEFAULT_CURRENCY,
  EMPLOYMENT_TYPES,
  WORKPLACE_TYPES
} from '../constants'
import type {
  CreateApplicationPayload,
  EmploymentType,
  JobApplication,
  WorkplaceType
} from '../services/applications.service'
import { ApplicationFormValidator } from '../validators/application-form.validator'

/** Field name to validation message. */
type FormErrors = Partial<Record<string, string>>

const formValidator = new ApplicationFormValidator()

/** Maximum step index of the form. */
const LAST_STEP = 1

/** Props for {@link ApplicationFormDialog}. */
interface ApplicationFormDialogProps {
  /** Whether the dialog is visible. */
  open: boolean
  /** Application being edited; omit to create a new one. */
  existing?: JobApplication
  /** Closes the dialog without saving. */
  onClose: () => void
  /** Persists the payload; the dialog closes when it resolves. */
  onSubmit: (payload: CreateApplicationPayload) => Promise<void>
}

/**
 * Two-step create/edit dialog for a job application.
 *
 * Step 1 collects the required basics (company, position) plus the
 * classification, step 2 the optional details (location, website, salary,
 * notes). Submitting validates both steps against
 * {@link ApplicationFormValidator}.
 *
 * The form state is initialised from `existing` when the component mounts, so
 * the caller must remount it (via `key`) for every dialog opening.
 */
export function ApplicationFormDialog({
  open,
  existing,
  onClose,
  onSubmit
}: Readonly<ApplicationFormDialogProps>) {
  const { t } = useTranslation('applications')
  const titleId = useId()

  const isEdit = Boolean(existing)

  // Step 1 — Basics
  const [companyName, setCompanyName] = useState(existing?.companyName ?? '')
  const [positionTitle, setPositionTitle] = useState(
    existing?.positionTitle ?? ''
  )
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>(
    existing?.employmentType ?? ''
  )
  const [workplaceType, setWorkplaceType] = useState<WorkplaceType | ''>(
    existing?.workplaceType ?? ''
  )

  // Step 2 — Details
  const [location, setLocation] = useState(existing?.jobLocation ?? '')
  const [website, setWebsite] = useState(existing?.companyWebsite ?? '')
  const [salaryMin, setSalaryMin] = useState(
    existing?.salaryMin != null ? String(existing.salaryMin) : ''
  )
  const [salaryMax, setSalaryMax] = useState(
    existing?.salaryMax != null ? String(existing.salaryMax) : ''
  )
  const [currency, setCurrency] = useState(
    existing?.salaryCurrency ?? DEFAULT_CURRENCY
  )
  const [notes, setNotes] = useState(existing?.notes ?? '')

  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function buildInput() {
    return {
      companyName,
      positionTitle,
      employmentType,
      workplaceType,
      location,
      website,
      salaryMin,
      salaryMax,
      currency,
      notes
    }
  }

  function validateFields(fields: readonly string[]): FormErrors {
    const result = formValidator.validate(buildInput())
    if (result.success) return {}

    const fieldErrors: FormErrors = {}
    for (const field of fields) {
      const messages = result.errors[field]
      if (messages?.length) fieldErrors[field] = messages[0]
    }
    return fieldErrors
  }

  function validateBasics(): FormErrors {
    return validateFields(['companyName', 'positionTitle'])
  }

  function validateDetails(): FormErrors {
    return validateFields(['website', 'salaryMin', 'salaryMax'])
  }

  function validateCurrentStep(): FormErrors {
    return step === 0 ? validateBasics() : validateDetails()
  }

  async function handleSubmit() {
    const fieldErrors = step === 0 ? validateBasics() : validateDetails()
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        companyName: companyName.trim(),
        positionTitle: positionTitle.trim(),
        status: existing?.status ?? 'DRAFT',
        employmentType: employmentType || undefined,
        workplaceType: workplaceType || undefined,
        jobLocation: location.trim() || undefined,
        companyWebsite: website.trim() || undefined,
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
        salaryCurrency: currency.trim() || undefined,
        notes: notes.trim() || undefined
      })
      onClose()
    } catch {
      // Keep the dialog open (and the input intact) so the user can retry;
      // the caller is responsible for surfacing the error.
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleNext() {
    const fieldErrors = validateCurrentStep()
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    if (step < LAST_STEP) {
      setStep((previous) => previous + 1)
      return
    }

    void handleSubmit()
  }

  function handleStepClick(index: number) {
    // Forward navigation validates the current step; creation is linear.
    if (index > step) {
      if (!isEdit) return

      const fieldErrors = validateCurrentStep()
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
        return
      }
    }

    setErrors({})
    setStep(index)
  }

  function submitLabel(): string {
    if (step < LAST_STEP) return t('form.actions.next')
    return isEdit ? t('form.actions.save') : t('form.actions.create')
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
        {isEdit ? t('form.editTitle') : t('form.createTitle')}
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Stepper nonLinear activeStep={step} sx={{ mb: 3 }}>
          <Step key="basics">
            <StepButton
              onClick={() => handleStepClick(0)}
              disabled={!isEdit && step > 0}
              aria-label={t('form.steps.basics')}
            >
              {t('form.steps.basics')}
            </StepButton>
          </Step>
          <Step key="details">
            <StepButton
              onClick={() => handleStepClick(1)}
              disabled={!isEdit && step > 1}
              aria-label={t('form.steps.details')}
            >
              {t('form.steps.details')}
            </StepButton>
          </Step>
        </Stepper>

        {step === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('form.stepHints.basics')}
            </Typography>
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
        )}

        {step === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('form.stepHints.details')}
            </Typography>
            <TextField
              label={t('form.fields.location')}
              placeholder={t('form.fields.locationPlaceholder')}
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              fullWidth
            />
            <TextField
              label={t('form.fields.website')}
              placeholder={t('form.fields.websitePlaceholder')}
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              error={Boolean(errors.website)}
              helperText={errors.website ?? ' '}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label={t('form.fields.salaryMin')}
                type="number"
                value={salaryMin}
                onChange={(event) => setSalaryMin(event.target.value)}
                error={Boolean(errors.salaryMin)}
                helperText={errors.salaryMin ?? ' '}
                fullWidth
              />
              <TextField
                label={t('form.fields.salaryMax')}
                type="number"
                value={salaryMax}
                onChange={(event) => setSalaryMax(event.target.value)}
                error={Boolean(errors.salaryMax)}
                helperText={errors.salaryMax ?? ' '}
                fullWidth
              />
              <TextField
                select
                label={t('form.fields.currency')}
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                sx={{ minWidth: 110 }}
              >
                {COMMON_CURRENCIES.map((code) => (
                  <MenuItem key={code} value={code}>
                    {code}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <TextField
              label={t('form.fields.notes')}
              multiline
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              fullWidth
            />
          </Box>
        )}
      </DialogContent>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 3,
          pb: 2,
          pt: 1
        }}
      >
        <Box>
          {step > 0 && (
            <Button
              onClick={() => setStep((previous) => previous - 1)}
              disabled={isSubmitting}
            >
              {t('form.actions.back')}
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            {t('form.actions.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              submitLabel()
            )}
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
