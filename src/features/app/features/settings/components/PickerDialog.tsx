import CheckIcon from '@mui/icons-material/Check'
import SearchIcon from '@mui/icons-material/Search'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import InputAdornment from '@mui/material/InputAdornment'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import TextField from '@mui/material/TextField'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

/** Props for {@link PickerDialog}. */
interface PickerDialogProps {
  /** Whether the dialog is visible. */
  open: boolean
  /** Dialog heading, e.g. the translated "Select Currency". */
  title: string
  /** Selectable option values. */
  options: string[]
  /** Currently selected value, highlighted in the list. */
  selected: string
  /** Dismisses the dialog without selecting. */
  onClose: () => void
  /** Selects a value (the dialog is closed by the picker itself). */
  onSelect: (value: string) => void
  /** Optional: override the display text for each option value. */
  getOptionLabel?: (value: string) => string
}

/**
 * Generic single-select dialog with a search field, used for choosing from a
 * fixed set of options (e.g. currencies).
 */
export function PickerDialog({
  open,
  title,
  options,
  selected,
  onClose,
  onSelect,
  getOptionLabel
}: Readonly<PickerDialogProps>) {
  const { t } = useTranslation('settings')
  const [search, setSearch] = useState('')

  const getLabel = getOptionLabel ?? ((value: string) => value)

  const filtered = options.filter((option) =>
    getLabel(option).toLowerCase().includes(search.toLowerCase())
  )

  function handleSelect(value: string) {
    onSelect(value)
    onClose()
  }

  function handleClose() {
    setSearch('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ pb: 0 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={t('picker.searchPlaceholder')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ mb: 1 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            },
            htmlInput: { 'aria-label': t('picker.searchAriaLabel') }
          }}
        />
        <List disablePadding sx={{ maxHeight: 320, overflowY: 'auto' }}>
          {filtered.map((option) => (
            <ListItemButton
              key={option}
              selected={option === selected}
              onClick={() => handleSelect(option)}
            >
              <ListItemText primary={getLabel(option)} />
              {option === selected && (
                <CheckIcon fontSize="small" color="primary" />
              )}
            </ListItemButton>
          ))}
          {filtered.length === 0 && (
            <ListItemText
              primary={t('picker.noResults')}
              sx={{ px: 2, color: 'text.secondary' }}
            />
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t('picker.cancel')}</Button>
      </DialogActions>
    </Dialog>
  )
}
