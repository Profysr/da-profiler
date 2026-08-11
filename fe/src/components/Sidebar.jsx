// src/components/Sidebar.jsx
import { useState, useRef, useCallback } from 'react'
import { useRoutesStore } from '../store/routesStore.js'
import { TARGET_KINDS, TARGET_KIND_ORDER } from '../utils/constants.js'
import { ProjectSelector, ConnectionManager } from './ConnectionManager.jsx'
import { Search, X, Loader2, ChevronDown, ChevronRight, Folder, Link as LinkIcon } from 'lucide-react'

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

  const toggleFolder = (kind) => {
    setExpandedFolders((prev) => ({ ...prev, [kind]: !prev[kind] }))
  }

  const handleResizeMouseDown = useCallback((e) => {
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
  }, [width, onWidthChange])

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
        {/* Workspace / Project Selector Header */}
        <div className="p-3 border-b border-outline-variant flex items-center justify-between bg-surface-container">
          <div className="flex-1 min-w-0">
            <ProjectSelector />
          </div>
          {/* <button
            type="button"
            onClick={() => setIsConnManagerOpen(true)}
            className="p-1.5 rounded-lg bg-surface-container-highest hover:bg-surface-variant border border-dialog-border text-on-surface-variant hover:text-primary transition-all shrink-0 ml-2"
            title="Manage Backend Connections"
          >
            <Icon name="add" size={14} />
          </button> */}
        </div>

        {/* Search Bar */}
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

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'executable', label: 'Triggerable' },
              { id: 'kind:view', label: 'Views' },
              { id: 'kind:task', label: 'Tasks' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`text-[10px] px-2.5 py-1 rounded transition-colors font-medium whitespace-nowrap ${
                  activeFilter === f.id
                    ? 'bg-primary text-white font-bold shadow-sm'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Target Collections Tree */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-3">
          {loading ? (
            <div className="p-4 text-center text-xs text-on-surface-variant flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              {/* <span>Loading targets...</span> */}
            </div>
          ) : filteredTargets.length === 0 ? (
            <div className="p-4 text-center text-xs text-on-surface-variant">
              No targets found for current collection/filter.
            </div>
          ) : (
            TARGET_KIND_ORDER.map((kind) => {
              const targets = groupedTargets[kind] || []
              if (targets.length === 0) return null
              const meta = TARGET_KINDS[kind] || {}
              const isExpanded = expandedFolders[kind]

              return (
                <div key={kind} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleFolder(kind)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors text-xs font-semibold"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <Folder size={14} className="text-primary" />
                      <span className="truncate">{meta.label}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-mono">
                      {targets.length}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="pl-4 space-y-1 border-l border-outline-variant ml-3">
                      {targets.map((target) => {
                        const isSelected = selectedTarget?.id === target.id
                        const methods = target.trigger_spec?.methods || ['GET']
                        const primaryMethod = methods[0] || 'GET'
                        const path = target.trigger_spec?.path || target.name || 'Unnamed Target'

                        return (
                          <button
                            key={target.id}
                            type="button"
                            onClick={() => onSelectTarget?.(target)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-all text-xs gap-2 group ${
                              isSelected
                                ? 'bg-primary/20 text-primary font-bold border-l-2 border-primary shadow-sm'
                                : 'hover:bg-surface-container-high text-on-surface/90'
                            }`}
                          >
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                                primaryMethod === 'GET'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : primaryMethod === 'POST'
                                  ? 'bg-orange-500/20 text-orange-400'
                                  : primaryMethod === 'PUT' || primaryMethod === 'PATCH'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : primaryMethod === 'DELETE'
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : 'bg-zinc-500/20 text-zinc-400'
                              }`}
                            >
                              {primaryMethod}
                            </span>

                            <span className="truncate font-mono text-[11px] flex-1 text-on-surface/90">
                              {path}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-outline-variant flex items-center justify-between text-xs text-on-surface-variant bg-surface-container">
          <button
            type="button"
            onClick={() => setIsConnManagerOpen(true)}
            className="flex items-center gap-1 hover:text-primary transition-colors text-[11px] font-semibold"
          >
            <LinkIcon size={14} />
            <span>Manage Connections</span>
          </button>
          <span className="text-[10px] font-mono text-on-surface-variant/60">v1.0.0</span>
        </div>

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
