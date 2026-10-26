import AddIcon from '@mui/icons-material/Add'
import Box from '@mui/material/Box'
import Fab from '@mui/material/Fab'
import Snackbar from '@mui/material/Snackbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import { ApplicationFilters } from '../components/ApplicationFilters'
import { ApplicationFormDialog } from '../components/ApplicationFormDialog'
import { ApplicationsList } from '../components/ApplicationsList'
import { DeleteConfirmationDialog } from '../components/DeleteConfirmationDialog'
import { isJobApplicationStatus } from '../constants'
import {
  useCreateApplication,
  useDeleteApplication,
  usePermanentDeleteApplication,
  useRestoreApplication,
  useUpdateApplication
} from '../hooks/use-applications'
import type {
  ApplicationFilters as ApplicationFiltersState,
  CreateApplicationPayload,
  JobApplication,
  JobApplicationStatus
} from '../services/applications.service'
import { applicationsPaths } from '../routes'
import { useApplicationFiltersStore } from '../store/application-filters.store'

/** How long a result message stays visible. */
const SNACKBAR_DURATION_MS = 3000

/** An application selected for (soft or permanent) deletion. */
interface DeleteTarget {
  id: string
  companyName: string
}

/**
 * Parses the comma-separated `statuses` search param used by dashboard links.
 *
 * Unknown values are dropped so a hand-edited URL cannot send an invalid status
 * to the API.
 *
 * @param value - Raw search param, e.g. `APPLIED,INTERVIEW`.
 * @returns The known statuses, without duplicates.
 */
function parseStatuses(value: string): JobApplicationStatus[] {
  const statuses = value
    .split(',')
    .map((status) => status.trim().toUpperCase())
    .filter(isJobApplicationStatus)

  return [...new Set(statuses)]
}

/**
 * Applications list page.
 *
 * Combines the filter bar, the paginated list and the create/edit/delete
 * dialogs. Filters live in {@link useApplicationFiltersStore} so they survive
 * navigation, while `?statuses=` links from the dashboard pre-seed (and are
 * then removed from) the URL.
 */
export function ApplicationsPage() {
  const { t } = useTranslation('applications')
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const statusesParam = searchParams.get('statuses')

  const filters = useApplicationFiltersStore((state) => state.filters)
  const setFilters = useApplicationFiltersStore((state) => state.setFilters)

  const [formOpen, setFormOpen] = useState(false)
  // Incremented per opening so the form dialog remounts with fresh state.
  const [formSession, setFormSession] = useState(0)
  const [editingApp, setEditingApp] = useState<JobApplication>()
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [permanentDeleteTarget, setPermanentDeleteTarget] =
    useState<DeleteTarget | null>(null)
  const [snackbar, setSnackbar] = useState<string | null>(null)

  const createMutation = useCreateApplication()
  const updateMutation = useUpdateApplication()
  const deleteMutation = useDeleteApplication()
  const restoreMutation = useRestoreApplication()
  const permanentDeleteMutation = usePermanentDeleteApplication()

  // Apply the filter requested by the dashboard once, then drop it from the URL
  // so a reload does not overwrite filters the user has changed since.
  //
  // A present-but-empty `statuses` means "every status": that is how the
  // dashboard's "Applications" tile clears a filter left over from the
  // "In Progress" tile. Without the param the stored filters are kept, so
  // coming back to the list from another page restores the user's view.
  useEffect(() => {
    if (statusesParam === null) return

    const statuses = parseStatuses(statusesParam)
    setFilters(statuses.length > 0 ? { statuses, page: 1 } : { page: 1 })

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('statuses')
    setSearchParams(nextParams, { replace: true })
  }, [statusesParam, searchParams, setFilters, setSearchParams])

  function handleFiltersChange(next: ApplicationFiltersState) {
    setFilters(next)
  }

  function handlePageChange(page: number) {
    setFilters({ ...filters, page })
  }

  function handleView(id: string) {
    void navigate(applicationsPaths.detail(id))
  }

  function handleCreate() {
    setEditingApp(undefined)
    setFormSession((session) => session + 1)
    setFormOpen(true)
  }

  function handleEdit(application: JobApplication) {
    setEditingApp(application)
    setFormSession((session) => session + 1)
    setFormOpen(true)
  }

  function handleFormClose() {
    // `editingApp` is kept so the title/footer do not change while the dialog
    // animates out; it is replaced the next time the form opens.
    setFormOpen(false)
  }

  async function handleFormSubmit(payload: CreateApplicationPayload) {
    if (editingApp) {
      try {
        await updateMutation.mutateAsync({ id: editingApp.id, payload })
        setSnackbar(t('messages.updated'))
      } catch (error) {
        setSnackbar(t('messages.updateFailed'))
        // Rethrow so the dialog stays open with the entered values.
        throw error
      }
      return
    }

    try {
      await createMutation.mutateAsync(payload)
      setSnackbar(t('messages.created'))
    } catch (error) {
      setSnackbar(t('messages.createFailed'))
      throw error
    }
  }

  function handleDelete(id: string, companyName: string) {
    setDeleteTarget({ id, companyName })
  }

  function handlePermanentDelete(id: string, companyName: string) {
    setPermanentDeleteTarget({ id, companyName })
  }

  async function handleRestore(id: string) {
    try {
      await restoreMutation.mutateAsync(id)
      setSnackbar(t('messages.restored'))
    } catch {
      setSnackbar(t('messages.restoreFailed'))
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return

    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      setSnackbar(t('messages.deleted'))
    } catch {
      setSnackbar(t('messages.deleteFailed'))
    } finally {
      setDeleteTarget(null)
    }
  }

  async function handleConfirmPermanentDelete() {
    if (!permanentDeleteTarget) return

    try {
      await permanentDeleteMutation.mutateAsync(permanentDeleteTarget.id)
      setSnackbar(t('messages.permanentlyDeleted'))
    } catch {
      setSnackbar(t('messages.permanentDeleteFailed'))
    } finally {
      setPermanentDeleteTarget(null)
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0
      }}
    >
      <ApplicationFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      <Box sx={{ flexGrow: 1, overflow: 'auto', px: 2, py: 2 }}>
        <Typography component="h1" variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          {t('title')}
        </Typography>

        <ApplicationsList
          filters={filters}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRestore={handleRestore}
          onPermanentDelete={handlePermanentDelete}
          onPageChange={handlePageChange}
        />
      </Box>

      {!filters.showDeleted && (
        <Tooltip title={t('fab.tooltip')}>
          <Fab
            color="primary"
            aria-label={t('fab.label')}
            sx={{
              position: 'fixed',
              bottom: { xs: 88, md: 24 },
              right: 24
            }}
            onClick={handleCreate}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      )}

      <ApplicationFormDialog
        key={formSession}
        open={formOpen}
        existing={editingApp}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />

      <DeleteConfirmationDialog
        open={deleteTarget !== null}
        companyName={deleteTarget?.companyName ?? ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <DeleteConfirmationDialog
        open={permanentDeleteTarget !== null}
        companyName={permanentDeleteTarget?.companyName ?? ''}
        isPermanent
        onConfirm={handleConfirmPermanentDelete}
        onCancel={() => setPermanentDeleteTarget(null)}
      />

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
