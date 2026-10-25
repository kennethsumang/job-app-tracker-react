import CssBaseline from '@mui/material/CssBaseline'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import type { ReactNode } from 'react'

/**
 * Shared MUI theme.
 *
 * Mirrors the theme used by `job-app-tracker-web`:
 * - light and dark color schemes driven by the OS preference
 * - Geist as the UI font
 * - 8px base corner radius
 */
const theme = createTheme({
  colorSchemes: {
    light: true,
    dark: true,
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
})

/** Props for {@link MuiProvider}. */
interface MuiProviderProps {
  /** Application tree that receives the theme. */
  children: ReactNode
}

/** Provides the shared MUI theme and CSS baseline to the app. */
export function MuiProvider({ children }: Readonly<MuiProviderProps>) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
