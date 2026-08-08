// hooks/useKeyboardShortcuts.js
import { useEffect, useCallback } from 'react'
import { useRoutesStore } from '../store/routesStore.js'
import { useProfileStore } from '../store/profileStore.js'
import { useUIStore } from '../store/uiStore.js'

/**
 * Hook for global keyboard shortcuts
 */
export function useKeyboardShortcuts() {
  const { searchQuery, setSearchQuery, filteredRoutes, selectRoute, selectedRoute } = useRoutesStore()
  const { runProfile, loading: profileLoading } = useProfileStore()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  
  const handleKeyDown = useCallback((event) => {
    // Ignore if typing in input/textarea/select
    const activeElement = document.activeElement
    const isTyping = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'SELECT' ||
      activeElement.isContentEditable
    )
    
    // Global shortcuts (work even when typing)
    if (event.metaKey || event.ctrlKey) {
      switch (event.key.toLowerCase()) {
        case 'b':
          event.preventDefault()
          toggleSidebar()
          break
        case 'k':
          // Command palette - future feature
          event.preventDefault()
          break
      }
      return
    }
    
    if (isTyping) return
    
    switch (event.key) {
      case '/':
        // Focus search input
        event.preventDefault()
        const searchInput = document.getElementById('route-search-input')
        if (searchInput) {
          searchInput.focus()
        }
        break
        
      case 'Escape':
        // Clear search or blur
        if (searchQuery) {
          setSearchQuery('')
        } else if (activeElement !== document.body) {
          activeElement.blur()
        }
        break
        
      case 'Enter':
        // Run profile if in controls area
        if (!profileLoading && selectedRoute) {
          const runBtn = document.getElementById('run-profile-btn')
          if (runBtn && !runBtn.disabled) {
            runBtn.click()
          }
        }
        break
        
      case 'ArrowLeft':
        // Previous tab
        if (selectedRoute) {
          const tabs = document.querySelectorAll('[data-tab-id]')
          const activeIndex = Array.from(tabs).findIndex(t => t.classList.contains('tab-btn-active'))
          if (activeIndex > 0) {
            tabs[activeIndex - 1].click()
          }
        }
        break
        
      case 'ArrowRight':
        // Next tab
        if (selectedRoute) {
          const tabs = document.querySelectorAll('[data-tab-id]')
          const activeIndex = Array.from(tabs).findIndex(t => t.classList.contains('tab-btn-active'))
          if (activeIndex >= 0 && activeIndex < tabs.length - 1) {
            tabs[activeIndex + 1].click()
          }
        }
        break
    }
  }, [searchQuery, setSearchQuery, selectedRoute, profileLoading, toggleSidebar, runProfile])
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}