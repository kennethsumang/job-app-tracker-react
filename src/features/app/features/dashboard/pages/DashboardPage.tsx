import AddIcon from '@mui/icons-material/Add'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import {
  applicationsPaths,
  useApplication
} from '@/features/app/features/applications'
import { DashboardQuickActionTile } from '../components/DashboardQuickActionTile'
import { DashboardSummaryCard } from '../components/DashboardSummaryCard'
import { UpcomingInterviewCard } from '../components/UpcomingInterviewCard'
import {
  IN_PROGRESS_STATUSES,
  useInProgressApplicationsCount,
  useTotalApplicationsCount,
  useUpcomingInterview
} from '../hooks/use-dashboard'

/** Background colour of the "all applications" summary tile. */
const TOTAL_CARD_COLOR = '#3B82F6'
/** Background colour of the "in progress" summary tile. */
const IN_PROGRESS_CARD_COLOR = '#8B5CF6'

/**
 * Dashboard page: greeting, application metrics, the next interview and quick
 * actions.
 *
 * The summary tiles link to the applications list; the "in progress" tile
 * carries the in-progress statuses as a `statuses` search param so the list
 * can pre-seed its filters.
 */
export function DashboardPage() {
  const { t } = useTranslation('dashboard')
  const navigate = useNavigate()

  const { data: totalCount, isLoading: totalLoading } =
    useTotalApplicationsCount()
  const { data: inProgressCount, isLoading: inProgressLoading } =
    useInProgressApplicationsCount()
  const { data: upcomingInterview, isLoading: interviewLoading } =
    useUpcomingInterview()

  // Interviews only carry the application id, so fetch its display details.
  const { data: upcomingApplication } = useApplication(
    upcomingInterview?.applicationId ?? ''
  )

  const applicationsPath = applicationsPaths.list
  const inProgressPath = `${applicationsPath}?statuses=${IN_PROGRESS_STATUSES.join(',')}`

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 800, mx: 'auto' }}>
      {/* Greeting */}
      <Box component="header" sx={{ mb: 3 }}>
        <Typography
          component="h1"
          variant="h5"
          gutterBottom
          sx={{ fontWeight: 700 }}
        >
          {t('greeting.title')}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          {t('greeting.subtitle')}
        </Typography>
      </Box>

      {/* Summary cards */}
      <Box
        component="section"
        sx={{ display: 'flex', gap: 2, mb: 3 }}
        aria-label={t('summary.ariaLabel')}
      >
        <DashboardSummaryCard
          icon={<WorkOutlineRoundedIcon fontSize="inherit" />}
          label={t('summary.applications')}
          count={totalCount}
          loading={totalLoading}
          backgroundColor={TOTAL_CARD_COLOR}
          ariaLabel={`${t('summary.applications')}: ${totalCount ?? t('summary.loading')}`}
          onClick={() => void navigate(applicationsPath)}
        />
        <DashboardSummaryCard
          icon={<TrendingUpIcon fontSize="inherit" />}
          label={t('summary.inProgress')}
          count={inProgressCount}
          loading={inProgressLoading}
          backgroundColor={IN_PROGRESS_CARD_COLOR}
          ariaLabel={`${t('summary.inProgress')}: ${inProgressCount ?? t('summary.loading')}`}
          onClick={() => void navigate(inProgressPath)}
        />
      </Box>

      {/* Upcoming interview */}
      {!interviewLoading && upcomingInterview && upcomingApplication && (
        <Box
          component="section"
          sx={{ mb: 3 }}
          aria-label={t('upcomingInterview.sectionLabel')}
        >
          <UpcomingInterviewCard
            interview={upcomingInterview}
            application={upcomingApplication}
            onClick={() =>
              void navigate(
                applicationsPaths.detail(upcomingInterview.applicationId)
              )
            }
          />
        </Box>
      )}

      {/* Quick actions */}
      <Box component="section" aria-label={t('quickActions.title')}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          {t('quickActions.title')}
        </Typography>
        <DashboardQuickActionTile
          icon={<AddIcon />}
          title={t('quickActions.addApplication.title')}
          subtitle={t('quickActions.addApplication.subtitle')}
          onClick={() => void navigate(applicationsPath)}
        />
      </Box>
    </Box>
  )
}
