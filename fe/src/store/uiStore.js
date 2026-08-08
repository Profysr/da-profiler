// store/uiStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '../utils/constants.js'

/**
 * UI store for persisted UI state
 */
export const useUIStore = create(
  persist(
    (set, get) => ({
      // State
      sidebarCollapsed: false,
      sidebarWidth: 320,
      panelSizes: [30, 70], // [sidebar%, main%]
      theme: 'dark',
      healthStatus: null, // 'connected' | 'disconnected' | null
      lastHealthCheck: null,
      
      // Actions
      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
      },
      
      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed })
      },
      
      setSidebarWidth: (width) => {
        set({ sidebarWidth: Math.max(240, Math.min(500, width)) })
      },
      
      setPanelSizes: (sizes) => {
        set({ panelSizes: sizes })
      },
      
      setTheme: (theme) => {
        set({ theme })
        document.documentElement.classList.toggle('dark', theme === 'dark')
      },
      
      setHealthStatus: (status) => {
        set({ 
          healthStatus: status, 
          lastHealthCheck: new Date().toISOString() 
        })
      },
      
      resetUI: () => {
        set({
          sidebarCollapsed: false,
          sidebarWidth: 320,
          panelSizes: [30, 70],
        })
      },
    }),
    {
      name: 'dqs.ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarWidth: state.sidebarWidth,
        panelSizes: state.panelSizes,
        theme: state.theme,
      }),
    }
  )
)