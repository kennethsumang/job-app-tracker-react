import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

/** Props for {@link DashboardSummaryCard}. */
interface DashboardSummaryCardProps {
  /** Icon rendered above the count. */
  icon: ReactNode
  /** Visible card label, e.g. "Applications". */
  label: string
  /** Current count, or `undefined` while it is still unknown. */
  count: number | undefined
  /** Whether the count is still loading. */
  loading?: boolean
  /** Card background colour. */
  backgroundColor: string
  /** Card foreground (text and icon) colour. Defaults to white. */
  foregroundColor?: string
  /** Accessible description of the card and its current value. */
  ariaLabel: string
  /** Optional click handler; the card is disabled when omitted. */
  onClick?: () => void
}

/**
 * Coloured dashboard tile that displays a metric count.
 *
 * Renders a skeleton placeholder while the count is loading and only becomes
 * interactive when an `onClick` handler is provided.
 */
export function DashboardSummaryCard({
  icon,
  label,
  count,
  loading = false,
  backgroundColor,
  foregroundColor = '#fff',
  ariaLabel,
  onClick,
}: Readonly<DashboardSummaryCardProps>) {
  const showSkeleton = loading || count === undefined

  return (
    <Card
      sx={{
        flex: 1,
        backgroundColor,
        color: foregroundColor,
        borderRadius: 3
      }}
      elevation={0}
    >
      <CardActionArea
        onClick={onClick}
        disabled={!onClick}
        aria-label={ariaLabel}
        sx={{ p: 2, height: '100%' }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box
            sx={{ fontSize: 28, lineHeight: 1, opacity: 0.85 }}
            aria-hidden="true"
          >
            {icon}
          </Box>
          {showSkeleton ? (
            <Skeleton
              variant="text"
              width={48}
              height={40}
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.3)' }}
            />
          ) : (
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, lineHeight: 1 }}
              aria-live="polite"
            >
              {count}
            </Typography>
          )}
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            {label}
          </Typography>
        </Box>
      </CardActionArea>
    </Card>
  )
}
