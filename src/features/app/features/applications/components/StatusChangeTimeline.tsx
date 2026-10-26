import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded'
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'
import Typography from '@mui/material/Typography'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStatusChangelogs } from '@/features/app/features/applications/hooks/use-application-detail'
import type { JobApplicationStatusChangelog } from '@/features/app/features/applications/services/applications.service'
import { StatusChip } from './StatusChip'

/** Props for a single status transition in the timeline. */
interface StatusChangeTimelineItemProps {
  changelog: JobApplicationStatusChangelog
  isLast: boolean
}

function StatusChangeTimelineItem({
  changelog,
  isLast
}: Readonly<StatusChangeTimelineItemProps>) {
  const { i18n } = useTranslation('applications')
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage ?? i18n.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(changelog.createdAt))

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        pb: isLast ? 0 : 2,
        position: 'relative'
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: 28,
          flexShrink: 0
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            bgcolor: 'secondary.50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <SwapHorizRoundedIcon
            sx={{ fontSize: 14, color: 'secondary.main' }}
          />
        </Box>
        {!isLast && (
          <Box
            sx={{
              width: 2,
              flex: 1,
              bgcolor: 'divider',
              mt: 0.25,
              minHeight: 12
            }}
          />
        )}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <StatusChip status={changelog.oldStatus} />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ flexShrink: 0 }}
              aria-hidden="true"
            >
              →
            </Typography>
            <StatusChip status={changelog.newStatus} />
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ flexShrink: 0 }}
          >
            {date}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

/** Expandable status history for an application. */
export function StatusChangeTimeline({
  applicationId
}: Readonly<{ applicationId: string }>) {
  const { t } = useTranslation('applications')
  const [expanded, setExpanded] = useState(false)
  const contentId = useId()
  const { data, isPending, isError } = useStatusChangelogs(applicationId)
  const changelogs = data ?? []

  return (
    <Box>
      <ButtonBase
        onClick={() => setExpanded((prev) => !prev)}
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 0.5,
          borderRadius: 1,
          px: 0.5
        }}
        aria-expanded={expanded}
        aria-controls={contentId}
      >
        <SwapHorizRoundedIcon
          sx={{ fontSize: 20, color: 'text.secondary' }}
          aria-hidden="true"
        />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {t('statusHistory.title')}
        </Typography>
        <Box sx={{ flex: 1 }} />
        {expanded ? (
          <KeyboardArrowUpRoundedIcon
            sx={{ color: 'text.secondary' }}
            aria-hidden="true"
          />
        ) : (
          <KeyboardArrowDownRoundedIcon
            sx={{ color: 'text.secondary' }}
            aria-hidden="true"
          />
        )}
      </ButtonBase>

      <Collapse in={expanded} id={contentId}>
        <Box sx={{ mt: 1 }}>
          {isPending && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress
                size={24}
                aria-label={t('statusHistory.loading')}
              />
            </Box>
          )}

          {isError && !isPending && (
            <Typography
              color="error"
              variant="body2"
              sx={{ py: 2, textAlign: 'center' }}
            >
              {t('statusHistory.loadError')}
            </Typography>
          )}

          {!isPending && !isError && changelogs.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ py: 2, textAlign: 'center' }}
            >
              {t('statusHistory.empty')}
            </Typography>
          )}

          {!isPending &&
            !isError &&
            changelogs.map((changelog, index) => (
              <StatusChangeTimelineItem
                key={changelog.id}
                changelog={changelog}
                isLast={index === changelogs.length - 1}
              />
            ))}
        </Box>
      </Collapse>
    </Box>
  )
}
