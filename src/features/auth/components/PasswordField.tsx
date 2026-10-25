import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import { useState } from 'react'

/** Props for {@link PasswordField}. */
interface PasswordFieldProps {
  id: string
  name: string
  label: string
  autoComplete: string
  /** Accessible label for the toggle while the value is hidden. */
  showLabel: string
  /** Accessible label for the toggle while the value is visible. */
  hideLabel: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: boolean
  helperText?: string | null
}

/**
 * Controlled password input with a lock icon and a visibility toggle.
 */
export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  showLabel,
  hideLabel,
  value,
  onChange,
  onBlur,
  error,
  helperText,
}: Readonly<PasswordFieldProps>) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <TextField
      id={id}
      name={name}
      label={label}
      type={isVisible ? 'text' : 'password'}
      autoComplete={autoComplete}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      error={error}
      helperText={helperText ?? ' '}
      required
      fullWidth
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <LockOutlinedIcon fontSize="small" aria-hidden="true" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                type="button"
                aria-label={isVisible ? hideLabel : showLabel}
                aria-pressed={isVisible}
                onClick={() => setIsVisible((current) => !current)}
                edge="end"
                size="small"
              >
                {isVisible ? (
                  <VisibilityOffOutlinedIcon fontSize="small" />
                ) : (
                  <VisibilityOutlinedIcon fontSize="small" />
                )}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  )
}
