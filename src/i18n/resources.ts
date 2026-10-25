import enDashboard from '@/features/app/features/dashboard/locales/en/dashboard.json'
import enAuth from '@/features/auth/locales/en/auth.json'
import enCalendar from '@/features/app/features/calendar/locales/en/calendar.json'
import enApplications from '@/features/app/features/applications/locales/en/applications.json'
import enSettings from '@/features/app/features/settings/locales/en/settings.json'

import esDashboard from '@/features/app/features/dashboard/locales/es/dashboard.json'
import esAuth from '@/features/auth/locales/es/auth.json'
import esCalendar from '@/features/app/features/calendar/locales/es/calendar.json'
import esApplications from '@/features/app/features/applications/locales/es/applications.json'
import esSettings from '@/features/app/features/settings/locales/es/settings.json'

import enCommon from './locales/en/common.json'
import esCommon from './locales/es/common.json'

/**
 * Bundled translation resources.
 *
 * Every feature owns its translations under
 * `src/features/<feature>/locales/<language>/<namespace>.json`.
 * Register the namespace here (and in `config.ts`) so it is bundled, typed,
 * and available on the first render.
 */
export const resources = {
  en: {
    dashboard: enDashboard,
    calendar: enCalendar,
    applications: enApplications,
    settings: enSettings,
    auth: enAuth,
    common: enCommon,
  },
  es: {
    dashboard: esDashboard,
    calendar: esCalendar,
    applications: esApplications,
    settings: esSettings,
    auth: esAuth,
    common: esCommon,
  },
} as const

/**
 * Shape of the English resources. Used to augment i18next's `t()` typing, so
 * a missing or misspelled key becomes a compile-time error.
 */
export type TranslationResources = (typeof resources)['en']
