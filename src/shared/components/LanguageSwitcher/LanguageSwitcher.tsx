import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined'
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import {
  fallbackLanguage,
  isSupportedLanguage,
  supportedLanguages,
  type SupportedLanguage,
} from '@/i18n/config'

/**
 * Labels for the supported locales.
 *
 * Each language is written in its own language (its autonym) so it stays
 * recognisable to speakers who cannot yet read the current UI language.
 */
const languageLabels: Record<SupportedLanguage, string> = {
  en: 'English (US)',
  es: 'Español',
}

/**
 * Language selector for the supported locales.
 *
 * The control mirrors the sidebar navigation items: a leading icon, a primary
 * label, and the active language underneath. Changing the value calls
 * i18next, which persists the choice and updates `<html lang>` through the
 * i18n language-change listener.
 */
export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()

  const currentLanguage = isSupportedLanguage(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : fallbackLanguage

  return (
    <Select
      size="small"
      value={currentLanguage}
      onChange={(event) => {
        const language = event.target.value
        if (isSupportedLanguage(language)) {
          void i18n.changeLanguage(language)
        }
      }}
      IconComponent={UnfoldMoreRoundedIcon}
      renderValue={() => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            minWidth: 0,
          }}
        >
          <LanguageOutlinedIcon
            fontSize="small"
            sx={{ color: 'text.secondary', flexShrink: 0 }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              noWrap
              sx={{ fontWeight: 600, lineHeight: 1.4 }}
            >
              {t('language.label')}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ display: 'block', lineHeight: 1.4 }}
            >
              {languageLabels[currentLanguage]}
            </Typography>
          </Box>
        </Box>
      )}
      inputProps={{ 'aria-label': t('language.label') }}
      MenuProps={{
        slotProps: {
          paper: {
            sx: { mt: 0.5, borderRadius: 2 },
          },
        },
      }}
      sx={{
        width: '100%',
        borderRadius: 2,
        bgcolor: 'action.hover',
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: 'divider',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: 'text.disabled',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: 'primary.main',
          borderWidth: 1,
        },
        '& .MuiSelect-select': {
          display: 'flex',
          alignItems: 'center',
          py: 1,
          pl: 1.5,
          pr: 4.5,
        },
        '& .MuiSelect-icon': {
          right: 12,
          fontSize: 18,
          color: 'text.secondary',
        },
      }}
    >
      {supportedLanguages.map((language) => (
        <MenuItem key={language} value={language}>
          {languageLabels[language]}
        </MenuItem>
      ))}
    </Select>
  )
}
