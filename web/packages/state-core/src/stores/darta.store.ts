import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { Darta, DartaFilterInput } from '@egov/api-types'
import type DeepWritable from '../utils/types'

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
  dartas: [] as Darta[],
  selectedDarta: null as Darta | null,
  filters: {} as unknown as DartaFilterInput,
  isLoading: false,
  error: null as string | null,
  draft: null as DartaDraft | null,
}

export const useDartaStore = create<DartaState>()(
  persist(
    immer((set) => ({
      ...initialState,

      setDartas: (dartas) => set((state) => {
        state.dartas = dartas as unknown as DeepWritable<Darta[]>
      }),

      selectDarta: (darta) => set((state) => {
        state.selectedDarta = darta as unknown as DeepWritable<Darta> | null
      }),

      setFilters: (filters) => set((state) => {
        state.filters = ({
          ...(state.filters as unknown as Record<string, any>),
          ...(filters as unknown as Record<string, any>),
        } as DartaFilterInput)
      }),

      setDraft: (draft) => set((state) => {
        state.draft = draft as unknown as DeepWritable<DartaDraft> | null
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

      reset: () => set((state) => {
  state.dartas = initialState.dartas as unknown as DeepWritable<Darta[]>
  state.selectedDarta = initialState.selectedDarta as unknown as DeepWritable<Darta> | null
  state.filters = initialState.filters as unknown as DeepWritable<DartaFilterInput>
        state.isLoading = initialState.isLoading
        state.error = initialState.error
        state.draft = initialState.draft as unknown as DeepWritable<DartaDraft> | null
      }),
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
