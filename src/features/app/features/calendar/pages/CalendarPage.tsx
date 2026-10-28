import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { CalendarView } from '../components/CalendarView'

/** Renders the interactive calendar for the authenticated application. */
export function CalendarPage() {
  const { t } = useTranslation('calendar')

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        p: { xs: 1, sm: 2 },
        gap: 2
      }}
    >
      <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
        {t('title')}
      </Typography>

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <CalendarView />
      </Box>
    </Box>
  )
}
