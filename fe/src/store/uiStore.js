// store/uiStore.js
//
// Zustand store for the workbench UI state:
//   - sidebar navigation tab
//   - sidebar width
//   - active request tab (pathParams, queryParams, headers, body, auth)
//   - active response tab (response, headers, queries, summary, sideEffects, logs)
//   - split pane top height
//
// ELI5: Pure UI state. By holding it here, child components subscribe only to
// what they render — e.g., changing the active response tab does NOT re-render
// the request panel, sidebar, or header.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUiStore = create(
  persist(
    (set) => ({
      // Sidebar
      activeSidebarNav: 'collections',
      sidebarWidth: 280,

      // Request panel
      activeRequestTab: 'queryParams',

      // Response panel
      activeResponseTab: 'response',

      // Split pane sizing (null = default 50/50)
      topHeight: null,

      // Actions
      setActiveSidebarNav: (activeSidebarNav) => set({ activeSidebarNav }),
      setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
      setActiveRequestTab: (activeRequestTab) => set({ activeRequestTab }),
      setActiveResponseTab: (activeResponseTab) => set({ activeResponseTab }),
      setTopHeight: (topHeight) => set({ topHeight }),
    }),
    {
      name: 'dqs.ui',
      partialize: (state) => ({
        activeSidebarNav: state.activeSidebarNav,
        sidebarWidth: state.sidebarWidth,
        activeRequestTab: state.activeRequestTab,
        activeResponseTab: state.activeResponseTab,
      }),
    }
  )
)
