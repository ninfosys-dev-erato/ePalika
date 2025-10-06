import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Chalani, ChalaniFilterInput } from "@egov/api-types";
import type { DraftDocument } from "./darta.store";
import type DeepWritable from "../utils/types";

export type ChalaniDraft = Partial<Chalani> & {
  recipientName?: string;
  recipientAddress?: string;
  dispatchChannel?: string;
  signatoryId?: string;
  documents?: DraftDocument[];
};

export interface ChalaniState {
  // Chalani list
  chalanis: Chalani[];
  selectedChalani: Chalani | null;
  pendingApprovals: Chalani[];

  // Filters
  filters: ChalaniFilterInput;

  // UI State
  isLoading: boolean;
  error: string | null;

  // Draft state (for offline)
  draft: ChalaniDraft | null;

  // Actions
  setChalanis: (chalanis: Chalani[]) => void;
  selectChalani: (chalani: Chalani | null) => void;
  setPendingApprovals: (approvals: Chalani[]) => void;
  setFilters: (filters: Partial<ChalaniFilterInput>) => void;
  setDraft: (draft: ChalaniDraft | null) => void;
  clearDraft: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// Only the plain data portion of the store (not actions)
const initialState = {
  chalanis: [] as Chalani[],
  selectedChalani: null as Chalani | null,
  pendingApprovals: [] as Chalani[],
  // GraphQL generated input types have required keys but their values can be null.
  // An empty object literal is not assignable to that shape, so cast here.
  filters: {} as unknown as ChalaniFilterInput,
  isLoading: false,
  error: null as string | null,
  draft: null as ChalaniDraft | null,
};

export const useChalaniStore = create<ChalaniState>()(
  persist(
    immer((set) => ({
      ...initialState,

      setChalanis: (chalanis) =>
        set((state) => {
          // Cast to DeepWritable so immer's draft mutation types align with generated readonly types
          state.chalanis = chalanis as unknown as DeepWritable<Chalani[]>;
        }),

      selectChalani: (chalani) =>
        set((state) => {
          state.selectedChalani =
            chalani as unknown as DeepWritable<Chalani> | null;
        }),

      setPendingApprovals: (approvals) =>
        set((state) => {
          state.pendingApprovals = approvals as unknown as DeepWritable<
            Chalani[]
          >;
        }),

      setFilters: (filters) =>
        set((state) => {
          // generated types use readonly properties; merge using casts to avoid excess strictness
          state.filters = {
            ...(state.filters as unknown as Record<string, any>),
            ...(filters as unknown as Record<string, any>),
          } as ChalaniFilterInput;
        }),

      setDraft: (draft) =>
        set((state) => {
          state.draft = draft as unknown as DeepWritable<ChalaniDraft> | null;
        }),

      clearDraft: () =>
        set((state) => {
          state.draft = null;
        }),

      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      reset: () =>
        set((state) => {
          // Do not replace the entire state object (would drop actions). Mutate fields instead.
          state.chalanis = initialState.chalanis as unknown as DeepWritable<
            Chalani[]
          >;
          state.selectedChalani =
            initialState.selectedChalani as unknown as DeepWritable<Chalani> | null;
          state.pendingApprovals =
            initialState.pendingApprovals as unknown as DeepWritable<Chalani[]>;
          state.filters =
            initialState.filters as unknown as DeepWritable<ChalaniFilterInput>;
          state.isLoading = initialState.isLoading;
          state.error = initialState.error;
          state.draft =
            initialState.draft as unknown as DeepWritable<ChalaniDraft> | null;
        }),
    })),
    {
      name: "chalani-store",
      partialize: (state) => ({
        // Only persist draft and filters
        draft: state.draft,
        filters: state.filters,
      }),
    }
  )
);
