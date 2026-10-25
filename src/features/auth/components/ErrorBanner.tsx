import Alert from '@mui/material/Alert'

/** Props for {@link ErrorBanner}. */
interface ErrorBannerProps {
  /** Human-readable error message. */
  message: string
}

/** Inline error alert used by the auth forms. */
export function ErrorBanner({ message }: Readonly<ErrorBannerProps>) {
  return (
    <Alert severity="error" role="alert">
      {message}
    </Alert>
  )
}
