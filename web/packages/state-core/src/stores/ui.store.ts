import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export interface UIState {
  // Bottom sheet
  bottomSheet: {
    isOpen: boolean
    content: React.ReactNode | null
  }

  // Toast notifications
  toasts: Array<{
    id: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
  }>

  // Theme
  theme: 'g10' | 'g90' | 'g100'

  // Sidebar
  sidebarOpen: boolean

  // Actions
  openBottomSheet: (content: React.ReactNode) => void
  closeBottomSheet: () => void
  addToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void
  removeToast: (id: string) => void
  setTheme: (theme: 'g10' | 'g90' | 'g100') => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    immer((set) => ({
      bottomSheet: {
        isOpen: false,
        content: null,
      },
      toasts: [],
      theme: 'g10',
      sidebarOpen: false,

      openBottomSheet: (content) => set((state) => {
        state.bottomSheet.isOpen = true
        state.bottomSheet.content = content
      }),

      closeBottomSheet: () => set((state) => {
        state.bottomSheet.isOpen = false
        state.bottomSheet.content = null
      }),

      addToast: (message, type) => set((state) => {
        const id = Date.now().toString()
        state.toasts.push({ id, message, type })
        // Auto-remove after 5s
        setTimeout(() => {
          set((state) => {
            state.toasts = state.toasts.filter((t) => t.id !== id)
          })
        }, 5000)
      }),

      removeToast: (id) => set((state) => {
        state.toasts = state.toasts.filter((t) => t.id !== id)
      }),

      setTheme: (theme) => set((state) => {
        state.theme = theme
      }),

      toggleSidebar: () => set((state) => {
        state.sidebarOpen = !state.sidebarOpen
      }),

      setSidebarOpen: (open) => set((state) => {
        state.sidebarOpen = open
      }),
    })),
    {
      name: 'ui-store',
      partialize: (state) => ({
        // Persist theme preference
        theme: state.theme,
      }),
    }
  )
)
