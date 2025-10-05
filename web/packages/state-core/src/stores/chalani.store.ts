import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { Chalani, ChalaniFilterInput } from '@egov/api-types'
import type { DraftDocument } from './darta.store'

export type ChalaniDraft = Partial<Chalani> & {
  recipientName?: string
  recipientAddress?: string
  dispatchChannel?: string
  signatoryId?: string
  documents?: DraftDocument[]
}

export interface ChalaniState {
  // Chalani list
  chalanis: Chalani[]
  selectedChalani: Chalani | null
  pendingApprovals: Chalani[]

  // Filters
  filters: ChalaniFilterInput

  // UI State
  isLoading: boolean
  error: string | null

  // Draft state (for offline)
  draft: ChalaniDraft | null

  // Actions
  setChalanis: (chalanis: Chalani[]) => void
  selectChalani: (chalani: Chalani | null) => void
  setPendingApprovals: (approvals: Chalani[]) => void
  setFilters: (filters: Partial<ChalaniFilterInput>) => void
  setDraft: (draft: ChalaniDraft | null) => void
  clearDraft: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  chalanis: [],
  selectedChalani: null,
  pendingApprovals: [],
  filters: {},
  isLoading: false,
  error: null,
  draft: null,
}

export const useChalaniStore = create<ChalaniState>()(
  persist(
    immer((set) => ({
      ...initialState,

      setChalanis: (chalanis) => set((state) => {
        state.chalanis = chalanis
      }),

      selectChalani: (chalani) => set((state) => {
        state.selectedChalani = chalani
      }),

      setPendingApprovals: (approvals) => set((state) => {
        state.pendingApprovals = approvals
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
      name: 'chalani-store',
      partialize: (state) => ({
        // Only persist draft and filters
        draft: state.draft,
        filters: state.filters,
      }),
    }
  )
)
