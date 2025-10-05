import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { Darta, DartaFilterInput } from '@egov/api-types'

export interface DraftDocument {
  id: string
  name: string
  dataUrl: string
  size: number
  type: string
  uploadedAt: string
}

export type DartaDraft = Partial<Darta> & {
  applicantName?: string
  applicantPhone?: string
  documents?: DraftDocument[]
}

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
  draft: DartaDraft | null

  // Actions
  setDartas: (dartas: Darta[]) => void
  selectDarta: (darta: Darta | null) => void
  setFilters: (filters: Partial<DartaFilterInput>) => void
  setDraft: (draft: DartaDraft | null) => void
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
