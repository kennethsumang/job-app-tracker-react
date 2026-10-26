import Chip from '@mui/material/Chip'
import { useTranslation } from 'react-i18next'
import { STATUS_CHIP_COLORS } from '../constants'
import type { JobApplicationStatus } from '../services/applications.service'

/** Props for {@link StatusChip}. */
interface StatusChipProps {
  /** Current status of the application. */
  status: JobApplicationStatus
}

/**
 * Coloured chip that displays an application status.
 *
 * The label is translated through the `applications` namespace, so every
 * status needs a `statuses.<STATUS>` entry.
 */
export function StatusChip({ status }: Readonly<StatusChipProps>) {
  const { t } = useTranslation('applications')

  return (
    <Chip
      size="small"
      color={STATUS_CHIP_COLORS[status]}
      label={t(`statuses.${status}`)}
      sx={{ fontWeight: 600 }}
    />
  )
}
