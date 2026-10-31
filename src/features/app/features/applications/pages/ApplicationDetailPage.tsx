import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges'
import RestoreIcon from '@mui/icons-material/Restore'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { ApplicationDetailHeader } from '../components/ApplicationDetailHeader'
import { ApplicationDetailInfo } from '../components/ApplicationDetailInfo'
import { ApplicationDetailNotes } from '../components/ApplicationDetailNotes'
import { ApplicationFormDialog } from '../components/ApplicationFormDialog'
import { DeleteConfirmationDialog } from '../components/DeleteConfirmationDialog'
import { InterviewsSection } from '../components/InterviewsSection'
import { NotesSection } from '../components/NotesSection'
import { StatusChangeTimeline } from '../components/StatusChangeTimeline'
import { StatusChangeDialog } from '../components/StatusChangeDialog'
import { useApplication } from '../hooks/use-application-detail'
import {
  useDeleteApplication,
  usePermanentDeleteApplication,
  useRestoreApplication,
  useUpdateApplication,
  useUpdateApplicationStatus
} from '../hooks/use-applications'
import { applicationsPaths } from '../routes'
import type {
  CreateApplicationPayload,
  UpdateApplicationStatusPayload
} from '../services/applications.service'

/** How long a result message stays visible. */
const SNACKBAR_DURATION_MS = 3000

/**
 * Detail page of a single job application.
 *
 * Mirrors the web app's detail page: top bar with the contextual actions, the
 * application header/information/notes, interviews and status history.
 */
export function ApplicationDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('applications')

  const { data: application, isPending, isError, error, refetch } =
    useApplication(id)

  const updateMutation = useUpdateApplication()
  const statusMutation = useUpdateApplicationStatus()
  const deleteMutation = useDeleteApplication()
  const restoreMutation = useRestoreApplication()
  const permanentDeleteMutation = usePermanentDeleteApplication()

  const [formOpen, setFormOpen] = useState(false)
  // Sessions are incremented per opening so the dialogs remount with fresh
  // state (their state is initialised from props on mount).
  const [formSession, setFormSession] = useState(0)
  const [statusOpen, setStatusOpen] = useState(false)
  const [statusSession, setStatusSession] = useState(0)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [permanentDeleteOpen, setPermanentDeleteOpen] = useState(false)
  const [snackbar, setSnackbar] = useState<string | null>(null)

  const isDeleted = application ? application.deletedAt !== null : false

  function handleBack() {
    void navigate(applicationsPaths.list)
  }

  function handleEdit() {
    setFormSession((session) => session + 1)
    setFormOpen(true)
  }

  function handleStatusChange() {
    setStatusSession((session) => session + 1)
    setStatusOpen(true)
  }

  async function handleFormSubmit(payload: CreateApplicationPayload) {
    if (!application) return

    try {
      await updateMutation.mutateAsync({ id: application.id, payload })
      setSnackbar(t('messages.updated'))
    } catch (mutationError) {
      setSnackbar(t('messages.updateFailed'))
      // Rethrow so the dialog stays open with the entered values.
      throw mutationError
    }
  }

  async function handleStatusSubmit(payload: UpdateApplicationStatusPayload) {
    if (!application) return

    try {
      await statusMutation.mutateAsync({ id: application.id, payload })
      setSnackbar(t('messages.statusUpdated'))
    } catch (mutationError) {
      setSnackbar(t('messages.statusUpdateFailed'))
      throw mutationError
    }
  }

  async function handleConfirmDelete() {
    if (!application) return

    try {
      await deleteMutation.mutateAsync(application.id)
      handleBack()
    } catch {
      setSnackbar(t('messages.deleteFailed'))
    } finally {
      setDeleteOpen(false)
    }
  }

  async function handleRestore() {
    if (!application) return

    try {
      await restoreMutation.mutateAsync(application.id)
      setSnackbar(t('messages.restored'))
    } catch {
      setSnackbar(t('messages.restoreFailed'))
    }
  }

  async function handleConfirmPermanentDelete() {
    if (!application) return

    try {
      await permanentDeleteMutation.mutateAsync(application.id)
      handleBack()
    } catch {
      setSnackbar(t('messages.permanentDeleteFailed'))
      setPermanentDeleteOpen(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', px: { xs: 2, sm: 3 }, py: 2, pb: 6 }}>
      {/* Top bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Tooltip title={t('detail.back')}>
          <IconButton
            onClick={handleBack}
            aria-label={t('detail.back')}
            size="small"
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>

        <Typography
          variant="h6"
          noWrap
          sx={{ flex: 1, minWidth: 0, fontWeight: 700 }}
        >
          {application?.companyName ?? t('detail.title')}
        </Typography>

        {application && isDeleted && (
          <>
            <Tooltip title={t('detail.restore')}>
              <IconButton
                color="primary"
                onClick={() => void handleRestore()}
                disabled={restoreMutation.isPending}
                aria-label={t('detail.restore')}
              >
                <RestoreIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('detail.permanentDelete')}>
              <IconButton
                color="error"
                onClick={() => setPermanentDeleteOpen(true)}
                aria-label={t('detail.permanentDelete')}
              >
                <DeleteForeverOutlinedIcon />
              </IconButton>
            </Tooltip>
          </>
        )}

        {application && !isDeleted && (
          <>
            <Tooltip title={t('detail.changeStatus')}>
              <IconButton
                onClick={handleStatusChange}
                aria-label={t('detail.changeStatus')}
                disabled={statusMutation.isPending}
              >
                <PublishedWithChangesIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('detail.edit')}>
              <IconButton onClick={handleEdit} aria-label={t('detail.edit')}>
                <EditOutlinedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('detail.delete')}>
              <IconButton
                color="error"
                onClick={() => setDeleteOpen(true)}
                aria-label={t('detail.delete')}
              >
                <DeleteOutlineRoundedIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>

      {/* Loading */}
      {isPending && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress aria-label={t('detail.loading')} />
        </Box>
      )}

      {/* Error */}
      {(isError || (!isPending && !application)) && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            py: 8,
            textAlign: 'center'
          }}
        >
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            {t('detail.loadError')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {error instanceof Error ? error.message : t('detail.loadErrorHint')}
          </Typography>
          <Button variant="outlined" onClick={() => void refetch()}>
            {t('detail.retry')}
          </Button>
        </Box>
      )}

      {/* Content */}
      {application && !isPending && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <ApplicationDetailHeader application={application} />
          <ApplicationDetailInfo application={application} />
          {application.notes?.trim() && (
            <ApplicationDetailNotes notes={application.notes} />
          )}
          <NotesSection
            applicationId={application.id}
            canEdit={!isDeleted}
            onSnackbar={setSnackbar}
          />
          {isDeleted && (
            <Typography variant="body2" sx={{ color: 'warning.main' }}>
              {t('detail.deletedBanner')}
            </Typography>
          )}
          <InterviewsSection
            applicationId={application.id}
            canEdit={!isDeleted}
            onSnackbar={setSnackbar}
          />
          <StatusChangeTimeline applicationId={application.id} />
        </Box>
      )}

      {/* Edit dialog */}
      {application && (
        <ApplicationFormDialog
          key={`edit-${formSession}`}
          open={formOpen}
          existing={application}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Status change dialog */}
      {application && (
        <StatusChangeDialog
          key={`status-${statusSession}`}
          open={statusOpen}
          currentStatus={application.status}
          onClose={() => setStatusOpen(false)}
          onSubmit={handleStatusSubmit}
        />
      )}

      {/* Delete confirmation */}
      {application && (
        <DeleteConfirmationDialog
          open={deleteOpen}
          companyName={application.companyName}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      )}

      {/* Permanent delete confirmation */}
      {application && (
        <DeleteConfirmationDialog
          open={permanentDeleteOpen}
          companyName={application.companyName}
          isPermanent
          onConfirm={handleConfirmPermanentDelete}
          onCancel={() => setPermanentDeleteOpen(false)}
        />
      )}

      <Snackbar
        open={snackbar !== null}
        autoHideDuration={SNACKBAR_DURATION_MS}
        onClose={() => setSnackbar(null)}
        message={snackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
