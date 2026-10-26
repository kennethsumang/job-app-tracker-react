import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'

/** Props for {@link ApplicationDetailNotes}. */
interface ApplicationDetailNotesProps {
  /** Notes written by the user. */
  notes: string
}

/**
 * Card with the free-form notes of an application.
 */
export function ApplicationDetailNotes({
  notes
}: Readonly<ApplicationDetailNotesProps>) {
  const { t } = useTranslation('applications')

  return (
    <Card>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <NotesOutlinedIcon
            sx={{ fontSize: 18, color: 'text.secondary' }}
            aria-hidden="true"
          />
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, color: 'text.secondary' }}
          >
            {t('detail.notes')}
          </Typography>
        </Box>
        <Typography
          variant="body2"
          sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        >
          {notes}
        </Typography>
      </CardContent>
    </Card>
  )
}
