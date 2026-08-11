// src/components/Header.jsx
import { useConnectionsStore } from '../store/connectionsStore.js'
import { ProjectSelector, ConnectionManager } from './ConnectionManager.jsx'
import { useState } from 'react'
import { WORKSPACE_TABS, HEADER_ICON_BUTTONS } from './workbench/data.js'

export function Header({
  activeTabId = 'workspaces',
  onTabChange,
  userAvatarUrl,
  "data-label": testId = 'global-header',
}) {
  const [isConnManagerOpen, setIsConnManagerOpen] = useState(false)

  return (
    <>
      <header
        className="bg-surface border-b border-outline-variant flex justify-between items-center w-full px-container-padding h-header-height shrink-0 z-50 select-none"
        data-label={testId}
      >
        <div className="flex items-center gap-4" data-label={`${testId}-left`}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">api</span>
            <span className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">
              Postman <span className="text-on-surface-variant font-normal text-xs uppercase tracking-wider ml-1">API Profiler</span>
            </span>
          </div>

          <div className="h-4 w-px bg-outline-variant mx-1" />

          {/* Project / Connection selector inside Header */}
          <ProjectSelector />

          <nav className="flex gap-1 h-full ml-2" data-label={`${testId}-nav`} role="tablist">
            {WORKSPACE_TABS.map((tab) => {
              const isActive = activeTabId === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange?.(tab.id)}
                  className={[
                    'flex items-center gap-1.5 h-full px-3 transition-colors text-xs font-medium border-b-2',
                    isActive
                      ? 'text-primary border-primary font-semibold bg-surface-container-high/40'
                      : 'text-on-surface-variant border-transparent hover:text-on-surface hover:bg-surface-container-high/20',
                  ].join(' ')}
                  role="tab"
                  aria-selected={isActive}
                >
                  <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2" data-label={`${testId}-right`}>
          <button
            type="button"
            onClick={() => setIsConnManagerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border border-outline-variant bg-surface-container hover:border-primary/50 text-on-surface transition-all"
            title="Manage Connections"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">settings_ethernet</span>
            <span>Connections</span>
          </button>

          <div className="flex items-center gap-1 border-l border-outline-variant pl-2 ml-1">
            {HEADER_ICON_BUTTONS.map((btn) => (
              <button
                key={btn.id}
                type="button"
                title={btn.title}
                className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">{btn.icon}</span>
              </button>
            ))}
          </div>

          <div
            className="w-7 h-7 rounded-full overflow-hidden border border-outline-variant shrink-0 bg-surface-container-high ml-1 flex items-center justify-center cursor-pointer"
            title="User Profile"
          >
            {userAvatarUrl ? (
              <img alt="User profile" className="w-full h-full object-cover" src={userAvatarUrl} />
            ) : (
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
            )}
          </div>
        </div>
      </header>

      <ConnectionManager
        isOpen={isConnManagerOpen}
        onClose={() => setIsConnManagerOpen(false)}
      />
    </>
  )
}
