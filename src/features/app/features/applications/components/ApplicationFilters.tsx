import ClearIcon from '@mui/icons-material/Clear'
import FilterListIcon from '@mui/icons-material/FilterList'
import SearchIcon from '@mui/icons-material/Search'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { debounce } from 'es-toolkit/function'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { JOB_APPLICATION_STATUSES } from '../constants'
import type {
  ApplicationFilters as ApplicationFiltersState,
  JobApplicationStatus
} from '../services/applications.service'

/** Debounce applied to the search input before the filters are updated. */
const SEARCH_DEBOUNCE_MS = 400

/** Props for {@link ApplicationFilters}. */
interface ApplicationFiltersProps {
  /** Filters currently applied to the list. */
  filters: ApplicationFiltersState
  /** Called with the next filters when the user changes them. */
  onFiltersChange: (filters: ApplicationFiltersState) => void
}

/**
 * Search field plus a filter drawer (statuses and deleted applications) for
 * the applications list.
 *
 * Typing in the search field updates the filters after a short debounce, while
 * the drawer keeps a draft state that is only applied on confirmation.
 */
export function ApplicationFilters({
  filters,
  onFiltersChange
}: Readonly<ApplicationFiltersProps>) {
  const { t } = useTranslation('applications')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [draftStatuses, setDraftStatuses] = useState<JobApplicationStatus[]>(
    filters.statuses ?? []
  )
  const [draftShowDeleted, setDraftShowDeleted] = useState(
    filters.showDeleted ?? false
  )
  const [searchValue, setSearchValue] = useState(filters.search ?? '')

  // Follow filter changes made outside this component (e.g. "clear all").
  // Adjusting state during render avoids an extra effect render pass.
  const [lastAppliedSearch, setLastAppliedSearch] = useState(
    filters.search ?? ''
  )
  if ((filters.search ?? '') !== lastAppliedSearch) {
    setLastAppliedSearch(filters.search ?? '')
    setSearchValue(filters.search ?? '')
  }

  const debouncedSearch = useMemo(
    () =>
      debounce(
        (
          value: string,
          current: ApplicationFiltersState,
          cb: (next: ApplicationFiltersState) => void
        ) => {
          cb({ ...current, search: value || undefined, page: 1 })
        },
        SEARCH_DEBOUNCE_MS
      ),
    []
  )

  // Cancel a pending search when the component unmounts.
  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch])

  const activeFilterCount =
    (filters.statuses?.length ? 1 : 0) + (filters.showDeleted ? 1 : 0)
  const hasAnyFilter = Boolean(filters.search) || activeFilterCount > 0

  function handleSearchChange(value: string) {
    setSearchValue(value)
    debouncedSearch(value, filters, onFiltersChange)
  }

  function handleClearAll() {
    debouncedSearch.cancel()
    setSearchValue('')
    onFiltersChange({})
    setDraftStatuses([])
    setDraftShowDeleted(false)
  }

  function openDrawer() {
    setDraftStatuses(filters.statuses ?? [])
    setDraftShowDeleted(filters.showDeleted ?? false)
    setDrawerOpen(true)
  }

  function applyDrawerFilters() {
    onFiltersChange({
      ...filters,
      statuses: draftStatuses.length > 0 ? draftStatuses : undefined,
      showDeleted: draftShowDeleted || undefined,
      page: 1
    })
    setDrawerOpen(false)
  }

  function toggleStatus(status: JobApplicationStatus) {
    setDraftStatuses((previous) =>
      previous.includes(status)
        ? previous.filter((candidate) => candidate !== status)
        : [...previous, status]
    )
  }

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <TextField
          size="small"
          placeholder={t('search.placeholder')}
          value={searchValue}
          onChange={(event) => handleSearchChange(event.target.value)}
          sx={{ flex: 1 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: filters.search ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    aria-label={t('search.clear')}
                    onClick={() => {
                      debouncedSearch.cancel()
                      handleSearchChange('')
                    }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null
            },
            htmlInput: { 'aria-label': t('search.ariaLabel') }
          }}
        />

        <Tooltip title={t('filters.title')}>
          <IconButton
            onClick={openDrawer}
            aria-label={t('filters.open')}
            sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}
          >
            <Badge
              color="primary"
              badgeContent={activeFilterCount}
              overlap="circular"
              invisible={activeFilterCount === 0}
            >
              <FilterListIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        {hasAnyFilter && (
          <Tooltip title={t('filters.clearAll')}>
            <IconButton
              size="small"
              onClick={handleClearAll}
              aria-label={t('filters.clearAll')}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 360 },
              p: 3,
              display: 'flex',
              flexDirection: 'column'
            }
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}
        >
          <Typography variant="h6">{t('filters.title')}</Typography>
          <Button
            size="small"
            onClick={() => {
              setDraftStatuses([])
              setDraftShowDeleted(false)
            }}
          >
            {t('filters.clearAll')}
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t('filters.status')}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {JOB_APPLICATION_STATUSES.map((status) => (
            <Chip
              key={status}
              size="small"
              clickable
              label={t(`statuses.${status}`)}
              color={draftStatuses.includes(status) ? 'primary' : 'default'}
              onClick={() => toggleStatus(status)}
            />
          ))}
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={draftShowDeleted}
              onChange={(event) => setDraftShowDeleted(event.target.checked)}
            />
          }
          label={t('filters.includeDeleted')}
        />

        <Box sx={{ mt: 'auto', pt: 3 }}>
          <Button variant="contained" fullWidth onClick={applyDrawerFilters}>
            {t('filters.apply')}
          </Button>
        </Box>
      </Drawer>
    </>
  )
}
