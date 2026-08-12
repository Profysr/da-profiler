// src/components/Sidebar.jsx
import { useState, useRef, useCallback } from 'react'
import { useRoutesStore } from '../store/routesStore.js'
import { TARGET_KINDS, TARGET_KIND_ORDER, ROUTE_FILTERS, getMethodBadgeClass } from '../utils/constants.js'
import { ProjectSelector, ConnectionManager } from './ConnectionManager.jsx'
import { Search, X, Loader2, ChevronDown, ChevronRight, Folder, Link as LinkIcon } from 'lucide-react'

// ----------------------------------------------------------------------
// 1. Method Badges Component (with +n overflow)
// ----------------------------------------------------------------------
function MethodBadges({ methods = ['GET'], maxVisible = 2 }) {
  if (!methods || methods.length === 0) return null

  const visibleMethods = methods.slice(0, maxVisible)
  const hiddenMethods = methods.slice(maxVisible)
  const hiddenCount = hiddenMethods.length

  return (
    <div className="flex items-center gap-1 shrink-0">
      {visibleMethods.map((method) => (
        <span key={method} className={getMethodBadgeClass(method)}>
          {method}
        </span>
      ))}
      {hiddenCount > 0 && (
        <span
          className="text-[9px] font-bold px-1 py-0.5 rounded bg-surface-container-highest text-on-surface-variant/80 border border-outline-variant/50"
          title={`Additional methods: ${hiddenMethods.join(', ')}`}
        >
          +{hiddenCount}
        </span>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------
// 2. Sidebar Header Component
// ----------------------------------------------------------------------
function SidebarHeader() {
  return (
    <div className="p-3 border-b border-outline-variant flex items-center justify-between bg-surface-container">
      <div className="flex-1 min-w-0">
        <ProjectSelector />
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// 3. Search and Filter Component
// ----------------------------------------------------------------------
function SidebarSearch({ searchQuery, setSearchQuery, activeFilter, setActiveFilter }) {
  return (
    <div className="p-3 border-b border-outline-variant bg-surface-container-low space-y-2.5">
      <div className="relative w-full">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search endpoints, routes..."
          className="w-full bg-surface-container-high border border-dialog-border rounded-lg py-2 pl-9 pr-8 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none transition-colors shadow-inner"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-xs"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
        {ROUTE_FILTERS.map((f) => {
          const isActive = activeFilter === f.value || activeFilter === f.id
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setActiveFilter(f.value)}
              className={`text-[10px] px-2.5 py-1 rounded transition-colors font-medium whitespace-nowrap ${isActive
                  ? 'bg-primary text-white font-bold shadow-sm'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant'
                }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------
// 4. Target Route Item
// ----------------------------------------------------------------------
function TargetItem({ target, isSelected, onSelect }) {
  const methods = target.target_details?.methods || ['GET']
  const path = target.target_details?.path || target.name || 'Unnamed Target'

  return (
    <button
      type="button"
      onClick={() => onSelect?.(target)}
      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-all text-xs gap-2 group ${isSelected
          ? 'bg-primary/20 text-primary font-bold border-l-2 border-primary shadow-sm'
          : 'hover:bg-surface-container-high text-on-surface/90'
        }`}
    >
      <MethodBadges methods={methods} maxVisible={2} />

      <span className="truncate font-mono text-[11px] flex-1 text-on-surface/90" title={path}>
        {path}
      </span>
    </button>
  )
}

// ----------------------------------------------------------------------
// 5. Target Folder Group Component
// ----------------------------------------------------------------------
function TargetFolder({ kind, targets, isExpanded, onToggle, selectedTarget, onSelectTarget }) {
  if (!targets || targets.length === 0) return null

  const meta = TARGET_KINDS[kind] || {}

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => onToggle(kind)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors text-xs font-semibold"
      >
        <div className="flex items-center gap-2 min-w-0">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Folder size={14} className="text-primary" />
          <span className="truncate">{meta.label || kind}</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-mono">
          {targets.length}
        </span>
      </button>

      {isExpanded && (
        <div className="pl-4 space-y-1 border-l border-outline-variant ml-3">
          {targets.map((target) => (
            <TargetItem
              key={target.id}
              target={target}
              isSelected={selectedTarget?.id === target.id}
              onSelect={onSelectTarget}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------
// 6. Navigation Tree Container
// ----------------------------------------------------------------------
function SidebarTree({ loading, filteredTargets, groupedTargets, expandedFolders, onToggleFolder, selectedTarget, onSelectTarget }) {
  if (loading) {
    return (
      <div className="p-4 text-center text-xs text-on-surface-variant flex items-center justify-center gap-2">
        <Loader2 size={14} className="animate-spin" />
      </div>
    )
  }

  if (filteredTargets.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-on-surface-variant">
        No targets found for current collection/filter.
      </div>
    )
  }

  return (
    <nav className="flex-1 overflow-y-auto p-3 space-y-3">
      {TARGET_KIND_ORDER.map((kind) => (
        <TargetFolder
          key={kind}
          kind={kind}
          targets={groupedTargets[kind] || []}
          isExpanded={expandedFolders[kind]}
          onToggle={onToggleFolder}
          selectedTarget={selectedTarget}
          onSelectTarget={onSelectTarget}
        />
      ))}
    </nav>
  )
}

// ----------------------------------------------------------------------
// 7. Sidebar Footer Component
// ----------------------------------------------------------------------
function SidebarFooter({ onOpenConnManager }) {
  return (
    <div className="p-3 border-t border-outline-variant flex items-center justify-between text-xs text-on-surface-variant bg-surface-container">
      <button
        type="button"
        onClick={onOpenConnManager}
        className="flex items-center gap-1 hover:text-primary transition-colors text-[11px] font-semibold"
      >
        <LinkIcon size={14} />
        <span>Manage Connections</span>
      </button>
      <span className="text-xs font-mono text-on-surface-variant/60">v1.0.0</span>
    </div>
  )
}

// ----------------------------------------------------------------------
// Main Sidebar Component
// ----------------------------------------------------------------------
export function Sidebar({
  onSelectTarget,
  selectedTarget,
  width = 280,
  onWidthChange,
  "data-label": testId = 'sidebar-navigator',
}) {
  const { filteredTargets, searchQuery, setSearchQuery, activeFilter, setActiveFilter, loading } = useRoutesStore()
  const [isConnManagerOpen, setIsConnManagerOpen] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState({
    view: true,
    task: true,
    consumer: false,
    signal: false,
  })

  const isResizingRef = useRef(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(280)

  const toggleFolder = useCallback((kind) => {
    setExpandedFolders((prev) => ({ ...prev, [kind]: !prev[kind] }))
  }, [])

  const handleResizeMouseDown = useCallback(
    (e) => {
      e.preventDefault()
      isResizingRef.current = true
      startXRef.current = e.clientX
      startWidthRef.current = width
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      const onMouseMove = (e) => {
        if (!isResizingRef.current) return
        const delta = e.clientX - startXRef.current
        const newWidth = Math.max(220, Math.min(480, startWidthRef.current + delta))
        onWidthChange?.(newWidth)
      }

      const onMouseUp = () => {
        isResizingRef.current = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [width, onWidthChange]
  )

  const groupedTargets = TARGET_KIND_ORDER.reduce((acc, kind) => {
    acc[kind] = filteredTargets.filter((t) => (t.kind || 'view') === kind)
    return acc
  }, {})

  return (
    <>
      <aside
        className="flex flex-col h-full z-40 bg-surface-container-low border-r-2 border-primary/40 shrink-0 select-none relative shadow-xl"
        style={{ width: `${width}px` }}
        data-label={testId}
        aria-label="Sidebar navigation"
      >
        <SidebarHeader />

        <SidebarSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />

        <SidebarTree
          loading={loading}
          filteredTargets={filteredTargets}
          groupedTargets={groupedTargets}
          expandedFolders={expandedFolders}
          onToggleFolder={toggleFolder}
          selectedTarget={selectedTarget}
          onSelectTarget={onSelectTarget}
        />

        <SidebarFooter onOpenConnManager={() => setIsConnManagerOpen(true)} />

        {/* Resizer Handle */}
        <div
          onMouseDown={handleResizeMouseDown}
          className="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-primary transition-colors z-50"
          title="Drag to resize sidebar"
        />
      </aside>

      <ConnectionManager
        isOpen={isConnManagerOpen}
        onClose={() => setIsConnManagerOpen(false)}
      />
    </>
  )
}