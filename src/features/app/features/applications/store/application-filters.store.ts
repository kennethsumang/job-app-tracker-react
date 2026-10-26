import { create } from 'zustand'
import type { ApplicationFilters } from '../services/applications.service'

/** State and actions of the applications list filter store. */
interface ApplicationFiltersStore {
  /** Filters currently applied to the applications list. */
  filters: ApplicationFilters
  /** Replaces the applied filters. */
  setFilters: (filters: ApplicationFilters) => void
  /** Clears every applied filter. */
  resetFilters: () => void
}

/**
 * Filters of the applications list.
 *
 * Kept in a store (rather than the URL) so the list keeps its filters while the
 * user navigates to other pages and back.
 */
export const useApplicationFiltersStore = create<ApplicationFiltersStore>()(
  (set) => ({
    filters: {},
    setFilters: (filters) => set({ filters }),
    resetFilters: () => set({ filters: {} })
  })
)
