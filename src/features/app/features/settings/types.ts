/** Settings returned by the API (`GET /settings`, `PATCH /settings`). */
export interface UserSettings {
  language: string;
  defaultCurrency: string;
  emailNotifications: boolean;
}

/** Fields accepted by `PATCH /settings`. */
export interface UpdateUserSettingsPayload {
  language?: string;
  defaultCurrency?: string;
  emailNotifications?: boolean;
}

// Only currencies that exist in the API's Currency enum.
export const COMMON_CURRENCIES: string[] = [
  'AUD',
  'BRL',
  'CAD',
  'CHF',
  'CNY',
  'DKK',
  'EUR',
  'GBP',
  'HKD',
  'INR',
  'JPY',
  'KRW',
  'MXN',
  'NOK',
  'NZD',
  'PHP',
  'SEK',
  'SGD',
  'USD',
  'ZAR'
]
