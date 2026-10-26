import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import RestoreIcon from '@mui/icons-material/Restore'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import dayjs from 'dayjs'
import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { JobApplication } from '../services/applications.service'
import { StatusChip } from './StatusChip'

/** Props for {@link ApplicationCard}. */
interface ApplicationCardProps {
  /** Application rendered by the card. */
  application: JobApplication
  /** Opens the application's detail page. */
  onView: () => void
  /** Opens the edit form. */
  onEdit: () => void
  /** Asks for confirmation before soft-deleting. */
  onDelete: () => void
  /** Restores a soft-deleted application. */
  onRestore: () => void
  /** Asks for confirmation before permanently deleting. */
  onPermanentDelete: () => void
}

/**
 * Formats an ISO timestamp as a short, locale-independent date.
 *
 * @param value - ISO timestamp to format.
 * @returns The date, e.g. `Mar 4, 2026`.
 */
function formatDate(value: string): string {
  return dayjs(value).format('MMM D, YYYY')
}

/**
 * Summary card for a single job application.
 *
 * The whole card opens the detail page; the footer buttons stop propagation so
 * they can trigger edit, delete, restore and permanent-delete instead.
 */
export function ApplicationCard({
  application,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onPermanentDelete
}: Readonly<ApplicationCardProps>) {
  const { t } = useTranslation('applications')

  const isDeleted = application.deletedAt !== null
  const dateLabel = isDeleted
    ? t('card.deletedOn', {
        date: formatDate(application.deletedAt ?? '')
      })
    : application.appliedAt
      ? t('card.appliedOn', { date: formatDate(application.appliedAt) })
      : t('card.createdOn', { date: formatDate(application.createdAt) })

  /**
   * Runs a footer action without also opening the detail page.
   *
   * @param event - Click event bubbling from the icon button.
   * @param action - Action to run.
   */
  function handleAction(event: MouseEvent, action: () => void) {
    event.stopPropagation()
    action()
  }

  return (
    <Card
      variant="outlined"
      sx={{
        opacity: isDeleted ? 0.7 : 1,
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 3 }
      }}
    >
      <CardActionArea
        // A div keeps the nested icon buttons valid; keyboard support is
        // re-implemented below.
        component="div"
        role="button"
        tabIndex={0}
        onClick={onView}
        onKeyDown={(event) => {
          // Ignore keys pressed on the nested action buttons.
          if (event.target !== event.currentTarget) return

          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onView()
          }
        }}
        aria-label={t('card.view', { company: application.companyName })}
      >
        <CardContent sx={{ pb: '12px !important' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                noWrap
                sx={{
                  fontWeight: 700,
                  color: isDeleted ? 'text.secondary' : 'text.primary'
                }}
              >
                {application.companyName}
              </Typography>
              <Typography
                variant="body2"
                noWrap
                sx={{ color: 'text.secondary' }}
              >
                {application.positionTitle}
              </Typography>
            </Box>
            <StatusChip status={application.status} />
          </Box>

          {/* Classification chips */}
          {(application.employmentType || application.workplaceType) && (
            <Box
              sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.25 }}
            >
              {application.employmentType && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={t(`employmentTypes.${application.employmentType}`)}
                />
              )}
              {application.workplaceType && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={t(`workplaceTypes.${application.workplaceType}`)}
                />
              )}
            </Box>
          )}

          {/* Footer */}
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.25 }}>
            <CalendarTodayOutlinedIcon
              sx={{ fontSize: 13, color: 'text.secondary', mr: 0.5 }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {dateLabel}
            </Typography>
            <Box sx={{ flex: 1 }} />

            {isDeleted ? (
              <>
                <Tooltip title={t('card.restore')}>
                  <IconButton
                    size="small"
                    color="primary"
                    aria-label={t('card.restore')}
                    onClick={(event) =>
                      handleAction(event, () => onRestore())
                    }
                  >
                    <RestoreIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('card.permanentDelete')}>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label={t('card.permanentDelete')}
                    onClick={(event) =>
                      handleAction(event, () => onPermanentDelete())
                    }
                  >
                    <DeleteForeverOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
                <Tooltip title={t('card.edit')}>
                  <IconButton
                    size="small"
                    aria-label={t('card.edit')}
                    onClick={(event) => handleAction(event, () => onEdit())}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('card.delete')}>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label={t('card.delete')}
                    onClick={(event) => handleAction(event, () => onDelete())}
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
