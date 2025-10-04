import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { Darta, DartaFilterInput } from '@egov/graphql-schema'

export interface DartaState {
  // Darta list
  dartas: Darta[]
  selectedDarta: Darta | null

  // Filters
  filters: DartaFilterInput

  // UI State
  isLoading: boolean
  error: string | null

  // Draft state (for offline)
  draft: Partial<Darta> | null

  // Actions
  setDartas: (dartas: Darta[]) => void
  selectDarta: (darta: Darta | null) => void
  setFilters: (filters: Partial<DartaFilterInput>) => void
  setDraft: (draft: Partial<Darta> | null) => void
  clearDraft: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  dartas: [],
  selectedDarta: null,
  filters: {},
  isLoading: false,
  error: null,
  draft: null,
}

export const useDartaStore = create<DartaState>()(
  persist(
    immer((set) => ({
      ...initialState,

      setDartas: (dartas) => set((state) => {
        state.dartas = dartas
      }),

      selectDarta: (darta) => set((state) => {
        state.selectedDarta = darta
      }),

      setFilters: (filters) => set((state) => {
        state.filters = { ...state.filters, ...filters }
      }),

      setDraft: (draft) => set((state) => {
        state.draft = draft
      }),

      clearDraft: () => set((state) => {
        state.draft = null
      }),

      setLoading: (loading) => set((state) => {
        state.isLoading = loading
      }),

      setError: (error) => set((state) => {
        state.error = error
      }),

      reset: () => set(initialState),
    })),
    {
      name: 'darta-store',
      partialize: (state) => ({
        // Only persist draft and filters
        draft: state.draft,
        filters: state.filters,
      }),
    }
  )
)
