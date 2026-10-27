import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUpdateUserSettings, useUserSettings } from '../hooks/use-user-settings'
import { COMMON_CURRENCIES } from '../types'
import { PickerDialog } from './PickerDialog'

/** Props for {@link SettingsPreferencesSection}. */
interface SettingsPreferencesSectionProps {
  /** Shows a result snackbar (message, optional error). */
  onSnackbar: (message: string, error?: boolean) => void
}

/** Editable preferences (currently the default currency). */
export function SettingsPreferencesSection({
  onSnackbar
}: Readonly<SettingsPreferencesSectionProps>) {
  const { t } = useTranslation('settings')
  const { data: settings } = useUserSettings()
  const updateMutation = useUpdateUserSettings()

  const [currencyOpen, setCurrencyOpen] = useState(false)

  async function handleCurrencySelect(currency: string) {
    if (currency === settings?.defaultCurrency) return
    try {
      await updateMutation.mutateAsync({ defaultCurrency: currency })
      onSnackbar(t('preferences.currencyUpdated'))
    } catch {
      onSnackbar(t('preferences.currencyUpdateFailed'), true)
    }
  }

  return (
    <>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ px: 2, pt: 2, display: 'block' }}
      >
        {t('preferences.heading')}
      </Typography>
      <List disablePadding>
        <ListItemButton
          onClick={() => setCurrencyOpen(true)}
          disabled={updateMutation.isPending}
        >
          <ListItemIcon>
            <AttachMoneyOutlinedIcon />
          </ListItemIcon>
          <ListItemText
            primary={t('preferences.currency')}
            secondary={settings?.defaultCurrency ?? '—'}
          />
          <ChevronRightIcon color="action" />
        </ListItemButton>
      </List>
      <Divider sx={{ mx: 2 }} />

      <PickerDialog
        open={currencyOpen}
        title={t('preferences.selectCurrency')}
        options={COMMON_CURRENCIES}
        selected={settings?.defaultCurrency ?? ''}
        onClose={() => setCurrencyOpen(false)}
        onSelect={handleCurrencySelect}
      />
    </>
  )
}
