// src/components/Sidebar.jsx
import { useState } from 'react'
import { useConnectionsStore } from '../store/connectionsStore.js'
import { useRoutesStore } from '../store/routesStore.js'
import { TARGET_KINDS, TARGET_KIND_ORDER } from '../utils/constants.js'
import { ConnectionManager } from './ConnectionManager.jsx'

export function Sidebar({
  activeNavId = 'collections',
  onNavSelect,
  onSelectTarget,
  selectedTarget,
  "data-label": testId = 'sidebar-navigator',
}) {
  const { connections, getActiveConnection } = useConnectionsStore()
  const { filteredTargets, searchQuery, setSearchQuery, activeFilter, setActiveFilter, loading } = useRoutesStore()
  const [isConnManagerOpen, setIsConnManagerOpen] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState({
    view: true,
    task: true,
    consumer: false,
    signal: false,
  })

  const activeConnection = getActiveConnection()

  const toggleFolder = (kind) => {
    setExpandedFolders((prev) => ({ ...prev, [kind]: !prev[kind] }))
  }

  // Group targets by kind
  const groupedTargets = TARGET_KIND_ORDER.reduce((acc, kind) => {
    acc[kind] = filteredTargets.filter((t) => (t.kind || 'view') === kind)
    return acc
  }, {})

  return (
    <>
      <aside
        className="flex flex-col h-full z-40 bg-surface-container-low border-r border-outline-variant shrink-0 select-none"
        style={{ width: 'var(--spacing-sidebar-width, 280px)' }}
        data-label={testId}
        aria-label="Sidebar navigation"
      >
        {/* Connection / Collection Info Banner */}
        <div className="p-3 border-b border-outline-variant flex items-center justify-between bg-surface/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              <span className="material-symbols-outlined text-[16px]">folder_special</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-label-caps uppercase text-on-surface-variant/70 tracking-wider">
                Active Collection
              </span>
              <span className="font-semibold text-xs text-on-surface truncate">
                {activeConnection?.name || 'No Connection'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsConnManagerOpen(true)}
            className="p-1 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors shrink-0"
            title="Configure Connections / Collections"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-2 border-b border-outline-variant">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search endpoints, routes..."
              className="w-full bg-background border border-outline-variant rounded py-1 pl-8 pr-7 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-xs"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1 mt-2 overflow-x-auto no-scrollbar pb-0.5">
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
                className={`text-[10px] px-2 py-0.5 rounded-full transition-colors font-medium whitespace-nowrap ${
                  activeFilter === f.id
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Target Collections Tree */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-3">
          {loading ? (
            <div className="p-4 text-center text-xs text-on-surface-variant flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
              <span>Loading targets...</span>
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
                  {/* Folder Header */}
                  <button
                    type="button"
                    onClick={() => toggleFolder(kind)}
                    className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors text-xs font-semibold"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="material-symbols-outlined text-[14px]">
                        {isExpanded ? 'expand_more' : 'chevron_right'}
                      </span>
                      <span className="material-symbols-outlined text-[16px] text-primary">folder</span>
                      <span className="truncate">{meta.label}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface-variant font-mono">
                      {targets.length}
                    </span>
                  </button>

                  {/* Folder Items */}
                  {isExpanded && (
                    <div className="pl-4 space-y-0.5 border-l border-outline-variant/60 ml-2.5">
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
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-left transition-colors text-xs gap-2 group ${
                              isSelected
                                ? 'bg-primary/15 text-primary font-medium border-l-2 border-primary'
                                : 'hover:bg-surface-container-highest text-on-surface'
                            }`}
                          >
                            <span
                              className={`text-[9px] font-mono font-bold px-1 rounded uppercase shrink-0 ${
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

                            <span className="truncate font-mono text-[11px] flex-1 text-on-surface/90 group-hover:text-on-surface">
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
        <div className="p-3 border-t border-outline-variant flex items-center justify-between text-xs text-on-surface-variant bg-surface/30">
          <button
            type="button"
            onClick={() => setIsConnManagerOpen(true)}
            className="flex items-center gap-1 hover:text-primary transition-colors text-[11px]"
          >
            <span className="material-symbols-outlined text-[14px]">add_link</span>
            <span>Register Connection</span>
          </button>
          <span className="text-[10px] font-mono text-on-surface-variant/60">v1.0.0</span>
        </div>
      </aside>

      <ConnectionManager
        isOpen={isConnManagerOpen}
        onClose={() => setIsConnManagerOpen(false)}
      />
    </>
  )
}
