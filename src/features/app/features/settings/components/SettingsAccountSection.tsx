import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'

/** Props for {@link SettingsAccountSection}. */
interface SettingsAccountSectionProps {
  /** Email of the signed-in user, shown read-only. */
  email: string
}

/** Read-only account summary (email address). */
export function SettingsAccountSection({
  email
}: Readonly<SettingsAccountSectionProps>) {
  const { t } = useTranslation('settings')

  return (
    <>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ px: 2, pt: 2, display: 'block' }}
      >
        {t('account.heading')}
      </Typography>
      <List disablePadding>
        <ListItem>
          <ListItemIcon>
            <EmailOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary={t('account.email')} secondary={email} />
        </ListItem>
      </List>
      <Divider sx={{ mx: 2 }} />
    </>
  )
}
