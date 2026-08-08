// components/layout/Sidebar.jsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, Filter, X, ChevronDown, Play, Key, List, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils/classNames.js'
import { useRoutesStore } from '../../store/routesStore.js'
import { useUIStore } from '../../store/uiStore.js'
import { ROUTE_FILTERS } from '../../utils/constants.js'
import { RouteSearch } from '../dashboard/RouteSearch.jsx'
import { RouteFilters } from '../dashboard/RouteFilters.jsx'
import { RouteList } from '../dashboard/RouteList.jsx'
import { EmptyState } from '../dashboard/EmptyState.jsx'

/**
 * Sidebar component with collapsible route list
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function Sidebar() {
  const {
    filteredRoutes,
    selectedRoute,
    searchQuery,
    activeFilter,
    loading,
    error,
    selectRoute,
    setSearchQuery,
    setActiveFilter,
    clearSelection,
  } = useRoutesStore()
  
  const { sidebarCollapsed, sidebarWidth, setSidebarWidth } = useUIStore()
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef(null)
  
  // Handle resize
  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return
    const newWidth = Math.max(240, Math.min(500, e.clientX))
    setSidebarWidth(newWidth)
  }, [isResizing, setSidebarWidth])
  
  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])
  
  const handleMouseDown = useCallback((e) => {
    if (e.target.classList.contains('resize-handle')) {
      setIsResizing(true)
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])
  
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])
  
  if (sidebarCollapsed) {
    return (
      <aside
        ref={sidebarRef}
        className={cn(
          'fixed top-14 left-0 bottom-0 z-30 bg-bg-secondary border-r border-border',
          'transition-all duration-normal overflow-hidden',
          'w-16'
        )}
        onMouseDown={handleMouseDown}
        aria-label="Sidebar (collapsed)"
      >
        <div className="absolute top-0 right-0 bottom-0 w-1 resize-handle cursor-col-resize hover:bg-accent-blue/30" />
        <div className="flex flex-col h-full px-2 py-4">
          <button
            className="p-2 rounded hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors mx-auto"
            onClick={() => useUIStore.getState().toggleSidebar()}
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <ChevronDown className="h-5 w-5 rotate-180" aria-hidden="true" />
          </button>
        </div>
      </aside>
    )
  }
  
  return (
    <aside
      ref={sidebarRef}
      className={cn(
        'fixed top-14 left-0 bottom-0 z-30 bg-bg-secondary border-r border-border',
        'transition-all duration-normal overflow-hidden flex flex-col',
        sidebarCollapsed ? 'w-16' : `w-[${sidebarWidth}px]`
      )}
      onMouseDown={handleMouseDown}
      style={{ width: sidebarCollapsed ? '64px' : `${sidebarWidth}px` }}
      aria-label="Sidebar"
    >
      <div className="absolute top-0 right-0 bottom-0 w-1 resize-handle cursor-col-resize hover:bg-accent-blue/30" />
      
      <div className="flex flex-col h-full">
        {/* Header with search and filters */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <RouteSearch 
            value={searchQuery} 
            onChange={setSearchQuery} 
            disabled={loading}
          />
          <RouteFilters 
            activeFilter={activeFilter} 
            onChange={setActiveFilter} 
            disabled={loading}
          />
        </div>
        
        {/* Route list */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-accent-blue" aria-hidden="true" />
                <span className="sr-only">Loading routes...</span>
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <p className="text-accent-red text-sm mb-2" role="alert">{error}</p>
                <button
                  onClick={() => useRoutesStore.getState().fetchRoutes()}
                  className="text-accent-blue hover:underline text-sm"
                >
                  Retry
                </button>
              </div>
            ) : filteredRoutes.length === 0 ? (
              <EmptyState 
                title="No routes found"
                description={searchQuery || activeFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'No executable routes discovered'}
              />
            ) : (
              <RouteList
                routes={filteredRoutes}
                selectedRoute={selectedRoute}
                onSelect={selectRoute}
              />
            )}
          </AnimatePresence>
        </div>
        
        {/* Footer */}
        <div className="p-3 border-t border-border flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>{filteredRoutes.length} of {useRoutesStore.getState().count} routes</span>
            {selectedRoute && (
              <button
                onClick={clearSelection}
                className="text-accent-blue hover:underline"
                aria-label="Clear selection"
              >
                Clear selection
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}