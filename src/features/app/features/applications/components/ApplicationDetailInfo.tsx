import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import dayjs from 'dayjs'
import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { JobApplication } from '../services/applications.service'

/** Props for the local {@link DetailRow} helper. */
interface DetailRowProps {
  /** Leading icon of the row. */
  icon: ReactNode
  /** Field label, e.g. "Applied". */
  label: string
  /** Field value, e.g. a date. */
  value: string
  /** When set, the value is rendered as an external link. */
  href?: string
}

/**
 * One label/value row of the detail information card.
 */
function DetailRow({ icon, label, value, href }: Readonly<DetailRowProps>) {
  return (
    <Box
      sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, px: 2, py: 1.5 }}
    >
      <Box
        sx={{ display: 'flex', color: 'text.secondary', mt: 0.25, flexShrink: 0 }}
        aria-hidden="true"
      >
        {icon}
      </Box>
      <Typography
        variant="caption"
        sx={{
          width: 80,
          flexShrink: 0,
          pt: 0.25,
          fontWeight: 500,
          color: 'text.secondary'
        }}
      >
        {label}
      </Typography>
      {href ? (
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          variant="body2"
          sx={{ wordBreak: 'break-all' }}
        >
          {value}
        </Link>
      ) : (
        <Typography variant="body2" sx={{ flex: 1 }}>
          {value}
        </Typography>
      )}
    </Box>
  )
}

/**
 * Compacts a salary into `k` notation.
 *
 * @param value - Raw salary amount.
 * @returns The amount, e.g. `80k` or `1250`.
 */
function formatSalary(value: number): string {
  if (value < 1000) return value.toFixed(0)

  const thousands = value / 1000
  return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}k`
}

/**
 * Formats the salary range of an application.
 *
 * @param application - Application providing the salary fields.
 * @param t - Translator of the `applications` namespace.
 * @returns The range text, or `null` when no salary is set.
 */
function formatSalaryRange(
  application: JobApplication,
  t: TFunction<'applications'>
): string | null {
  const currency = (application.salaryCurrency ?? '').trim()
  const min =
    application.salaryMin != null ? formatSalary(application.salaryMin) : null
  const max =
    application.salaryMax != null ? formatSalary(application.salaryMax) : null

  if (!min && !max) return null

  const label =
    min && max
      ? t('detail.salaryRange', { currency, min, max })
      : min
        ? t('detail.salaryFrom', { currency, min })
        : t('detail.salaryUpTo', { currency, max: max ?? '' })

  // Collapse the space left behind by an empty currency.
  return label.replace(/\s{2,}/g, ' ').trim()
}

/** Props for {@link ApplicationDetailInfo}. */
interface ApplicationDetailInfoProps {
  /** Application whose details are rendered. */
  application: JobApplication
}

/**
 * Information card of the application detail page: applied/created dates,
 * location, company website and salary. Rows without a value are omitted.
 */
export function ApplicationDetailInfo({
  application
}: Readonly<ApplicationDetailInfoProps>) {
  const { t } = useTranslation('applications')

  const salaryLabel = formatSalaryRange(application, t)
  const website = application.companyWebsite
  const websiteHref =
    website && /^https?:\/\//.test(website) ? website : undefined

  const rows: { key: string; row: DetailRowProps }[] = [
    {
      key: 'applied',
      row: {
        icon: <SendOutlinedIcon sx={{ fontSize: 20 }} />,
        label: t('detail.applied'),
        value: application.appliedAt
          ? dayjs(application.appliedAt).format('MMM D, YYYY')
          : '—'
      }
    },
    {
      key: 'created',
      row: {
        icon: <CalendarTodayOutlinedIcon sx={{ fontSize: 20 }} />,
        label: t('detail.created'),
        value: dayjs(application.createdAt).format('MMM D, YYYY')
      }
    }
  ]

  if (application.jobLocation) {
    rows.push({
      key: 'location',
      row: {
        icon: <PlaceOutlinedIcon sx={{ fontSize: 20 }} />,
        label: t('detail.location'),
        value: application.jobLocation
      }
    })
  }

  if (website) {
    rows.push({
      key: 'website',
      row: {
        icon: <LinkOutlinedIcon sx={{ fontSize: 20 }} />,
        label: t('detail.website'),
        value: website,
        href: websiteHref
      }
    })
  }

  if (salaryLabel) {
    rows.push({
      key: 'salary',
      row: {
        icon: <PaymentsOutlinedIcon sx={{ fontSize: 20 }} />,
        label: t('detail.salary'),
        value: salaryLabel
      }
    })
  }

  return (
    <Card>
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        {rows.map((entry, index) => (
          <Box key={entry.key}>
            <DetailRow {...entry.row} />
            {index < rows.length - 1 && <Divider sx={{ mx: 2 }} />}
          </Box>
        ))}
      </CardContent>
    </Card>
  )
}
