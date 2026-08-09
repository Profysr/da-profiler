// components/layout/Sidebar.jsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils/classNames.js'
import { useRoutesStore } from '../../store/routesStore.js'
import { useUIStore } from '../../store/uiStore.js'
import { ROUTE_FILTERS } from '../../utils/constants.js'
import { RouteList } from '../dashboard/RouteList.jsx'
import { EmptyState } from '../dashboard/EmptyState.jsx'

/**
 * Sidebar component with collapsible route list matching design
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
  } = useRoutesStore()

  const { sidebarCollapsed, sidebarWidth, setSidebarWidth } = useUIStore()
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef(null)

  // Handle resize - use refs to avoid temporal dead zone
  const handleMouseMoveRef = useRef(null)
  const handleMouseUpRef = useRef(null)

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
    document.removeEventListener('mousemove', handleMouseMoveRef.current)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [])

  handleMouseUpRef.current = handleMouseUp

  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return
    const newWidth = Math.max(240, Math.min(500, e.clientX))
    setSidebarWidth(newWidth)
  }, [isResizing, setSidebarWidth])

  handleMouseMoveRef.current = handleMouseMove

  const handleMouseDown = useCallback((e) => {
    if (e.target.classList.contains('resize-handle')) {
      setIsResizing(true)
      document.addEventListener('mousemove', handleMouseMoveRef.current)
      document.addEventListener('mouseup', handleMouseUpRef.current)
    }
  }, [])

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMoveRef.current)
      document.removeEventListener('mouseup', handleMouseUpRef.current)
    }
  }, [])

  if (sidebarCollapsed) {
    return (
      <aside
        ref={sidebarRef}
        className={cn(
          'fixed top-16 left-0 bottom-0 z-40 bg-surface-container border-r border-outline-variant',
          'transition-all duration-normal overflow-hidden',
          'w-16'
        )}
        onMouseDown={handleMouseDown}
        aria-label="Sidebar (collapsed)"
      >
        <div className="absolute top-0 right-0 bottom-0 w-1 resize-handle cursor-col-resize hover:bg-primary/30" />
        <div className="flex flex-col h-full px-2 py-4">
          <button
            className="p-2 rounded hover:bg-surface-variant text-on-surface transition-colors mx-auto"
            onClick={() => useUIStore.getState().toggleSidebar()}
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <span className="material-symbols-outlined h-5 w-5 rotate-180" aria-hidden="true">chevron_right</span>
          </button>
        </div>
      </aside>
    )
  }

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        'fixed top-16 left-0 bottom-0 z-40 bg-surface-container border-r border-outline-variant',
        'transition-all duration-normal overflow-hidden flex flex-col',
        sidebarCollapsed ? 'w-16' : `w-[${sidebarWidth}px]`
      )}
      onMouseDown={handleMouseDown}
      style={{ width: sidebarCollapsed ? '64px' : `${sidebarWidth}px` }}
      aria-label="Sidebar"
    >
      <div className="absolute top-0 right-0 bottom-0 w-1 resize-handle cursor-col-resize hover:bg-primary/30" />

      <div className="flex flex-col h-full">
        {/* Header with branding */}
        <div className="px-md py-md border-b border-outline-variant mb-2 flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded bg-surface-variant flex items-center justify-center text-primary border border-outline-variant">
              <span className="material-symbols-outlined">api</span>
            </div>
            <div>
              <div className="font-headline-sm text-headline-sm text-on-surface">Da Profiler</div>
              <div className="font-body-sm text-body-sm text-on-surface-variant">API Intelligence</div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center bg-surface border border-outline-variant rounded px-3 py-2 focus-within:ring-1 focus-within:ring-primary shadow-sm">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px] mr-2">search</span>
              <input
                className="input bg-transparent border-none outline-none text-body-sm font-body-sm text-on-surface placeholder:text-on-surface-variant w-full p-0 focus:ring-0"
                placeholder="Search routes..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {ROUTE_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  disabled={loading}
                  className={cn(
                    'rounded-full px-2 py-0.5 font-label-caps text-label-caps cursor-pointer transition-colors',
                    activeFilter === filter.value
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'bg-surface-variant text-on-surface border border-outline-variant hover:bg-surface-bright'
                  )}
                  aria-pressed={activeFilter === filter.value}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Route list */}
        <div className="flex-1 overflow-y-auto px-md py-sm flex flex-col gap-2">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-full"
              >
                <span className="material-symbols-outlined h-8 w-8 animate-spin text-primary" aria-hidden="true">refresh</span>
                <span className="sr-only">Loading routes...</span>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 text-center"
              >
                <p className="text-error text-sm mb-2" role="alert">{error}</p>
                <button
                  onClick={() => useRoutesStore.getState().fetchRoutes()}
                  className="text-primary hover:underline text-sm"
                >
                  Retry
                </button>
              </motion.div>
            ) : filteredRoutes.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <EmptyState
                  title="No routes found"
                  description={searchQuery || activeFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'No executable routes discovered'}
                />
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <RouteList
                  routes={filteredRoutes}
                  selectedRoute={selectedRoute}
                  onSelect={selectRoute}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-md py-4 mt-auto border-t border-outline-variant flex-shrink-0">
          <button className="w-full border border-primary text-primary font-label-caps text-label-caps py-2 rounded hover:bg-primary/10 transition-colors flex justify-center items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[16px]">add</span> New Profile
          </button>
          <div className="flex flex-col gap-1">
            <a className="flex items-center gap-3 px-2 py-1.5 text-on-surface-variant hover:text-on-surface transition-colors font-body-sm text-body-sm" href="#">
              <span className="material-symbols-outlined text-[18px]">description</span> Docs
            </a>
            <a className="flex items-center gap-3 px-2 py-1.5 text-on-surface-variant hover:text-on-surface transition-colors font-body-sm text-body-sm" href="#">
              <span className="material-symbols-outlined text-[18px]">contact_support</span> Support
            </a>
          </div>
        </div>
      </div>
    </aside>
  )
}