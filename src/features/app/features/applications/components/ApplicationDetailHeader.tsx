import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import type { JobApplication } from '../services/applications.service'
import { StatusChip } from './StatusChip'

/** Props for {@link ApplicationDetailHeader}. */
interface ApplicationDetailHeaderProps {
  /** Application rendered in the header. */
  application: JobApplication
}

/**
 * Header card of the application detail page: company initial, company name,
 * position and the status/classification chips.
 */
export function ApplicationDetailHeader({
  application
}: Readonly<ApplicationDetailHeaderProps>) {
  const { t } = useTranslation('applications')

  const initial = application.companyName.charAt(0).toUpperCase() || '?'

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          {/* Company initial avatar */}
          <Box
            aria-hidden="true"
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2,
              bgcolor: 'action.selected',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: 'primary.main' }}
            >
              {initial}
            </Typography>
          </Box>

          {/* Company name + position */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, wordBreak: 'break-word' }}
            >
              {application.companyName}
            </Typography>
            <Typography
              variant="body1"
              sx={{ mt: 0.25, color: 'text.secondary' }}
            >
              {application.positionTitle}
            </Typography>
          </Box>
        </Box>

        {/* Chips row */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
          <StatusChip status={application.status} />
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
      </CardContent>
    </Card>
  )
}
