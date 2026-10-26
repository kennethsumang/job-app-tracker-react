import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

/** Props for {@link DashboardQuickActionTile}. */
interface DashboardQuickActionTileProps {
  /** Icon rendered inside the tile avatar. */
  icon: ReactNode
  /** Primary tile label. */
  title: string
  /** Optional secondary description. */
  subtitle?: string
  /** Click handler invoked when the tile is activated. */
  onClick?: () => void
}

/**
 * Full-width dashboard shortcut tile with an icon, a title, a subtitle and a
 * chevron affordance.
 */
export function DashboardQuickActionTile({
  icon,
  title,
  subtitle,
  onClick,
}: Readonly<DashboardQuickActionTileProps>) {
  return (
    <Card sx={{ borderRadius: 3 }} elevation={0} variant="outlined">
      <CardActionArea
        onClick={onClick}
        disabled={!onClick}
        sx={{ px: 2, py: 1.5 }}
        aria-label={title}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
              width: 44,
              height: 44
            }}
            aria-hidden="true"
          >
            {icon}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>

          <ChevronRightIcon
            sx={{ opacity: 0.4, flexShrink: 0 }}
            aria-hidden="true"
          />
        </Box>
      </CardActionArea>
    </Card>
  )
}
