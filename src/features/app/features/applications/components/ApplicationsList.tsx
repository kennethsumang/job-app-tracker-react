import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Pagination from '@mui/material/Pagination'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { DEFAULT_PAGE_SIZE } from '../constants'
import { useApplications } from '../hooks/use-applications'
import type {
  ApplicationFilters,
  JobApplication
} from '../services/applications.service'
import { ApplicationCard } from './ApplicationCard'

/** Number of skeleton cards rendered while the first page loads. */
const SKELETON_COUNT = 5

/** Props for {@link ApplicationsList}. */
interface ApplicationsListProps {
  /** Filters applied to the API request. */
  filters: ApplicationFilters
  /** Opens the detail page of an application. */
  onView: (id: string) => void
  /** Opens the edit form for an application. */
  onEdit: (application: JobApplication) => void
  /** Asks for confirmation before soft-deleting an application. */
  onDelete: (id: string, companyName: string) => void
  /** Restores a soft-deleted application. */
  onRestore: (id: string) => void
  /** Asks for confirmation before permanently deleting an application. */
  onPermanentDelete: (id: string, companyName: string) => void
  /** Moves the list to another page. */
  onPageChange: (page: number) => void
}

/**
 * Paginated applications list with loading, error and empty states.
 */
export function ApplicationsList({
  filters,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onPermanentDelete,
  onPageChange
}: Readonly<ApplicationsListProps>) {
  const { t } = useTranslation('applications')
  const { data, isPending, isError, error, refetch } = useApplications(filters)

  const limit = filters.limit ?? DEFAULT_PAGE_SIZE
  const currentPage = filters.page ?? 1

  if (isPending) {
    return (
      <Box
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        aria-busy="true"
        aria-label={t('list.loading')}
      >
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          // Skeleton placeholders are static, so the index is a stable key.
          <Skeleton key={index} variant="rounded" height={120} />
        ))}
      </Box>
    )
  }

  if (isError) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 8,
          gap: 2
        }}
      >
        <Typography variant="body1" sx={{ color: 'error.main' }}>
          {error instanceof Error ? error.message : t('list.error')}
        </Typography>
        <Button variant="outlined" onClick={() => void refetch()}>
          {t('list.retry')}
        </Button>
      </Box>
    )
  }

  const applications = data?.data ?? []
  const total = data?.count ?? 0
  const pageCount = Math.ceil(total / limit)

  if (applications.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 8,
          gap: 2,
          textAlign: 'center'
        }}
      >
        <WorkOutlineRoundedIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
        <Typography variant="h6" sx={{ color: 'text.secondary' }}>
          {filters.showDeleted ? t('list.emptyDeleted') : t('list.empty')}
        </Typography>
        {!filters.showDeleted && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('list.emptyHint')}
          </Typography>
        )}
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {applications.map((application) => (
        <ApplicationCard
          key={application.id}
          application={application}
          onView={() => onView(application.id)}
          onEdit={() => onEdit(application)}
          onDelete={() => onDelete(application.id, application.companyName)}
          onRestore={() => onRestore(application.id)}
          onPermanentDelete={() =>
            onPermanentDelete(application.id, application.companyName)
          }
        />
      ))}

      {pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={pageCount}
            page={currentPage}
            color="primary"
            onChange={(_, page) => onPageChange(page)}
            aria-label={t('list.pagination')}
          />
        </Box>
      )}
    </Box>
  )
}
