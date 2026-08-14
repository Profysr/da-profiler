// src/components/Header.jsx
import { useState, useEffect } from 'react'
import { useUiStore } from '../store/uiStore.js'
import { Globe, Cable, User, Moon, Sun, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { ConnectionManager } from './ConnectionManager.jsx'
import { HEADER_ICON_BUTTONS } from '../utils/constants.js'

export function Header({
  userAvatarUrl,
  "data-label": testId = 'global-header',
}) {
  const [isConnManagerOpen, setIsConnManagerOpen] = useState(false)
  const { theme, setTheme, isCollapsed, setIsCollapsed } = useUiStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <>
      <header
        className="bg-surface-container border-b border-outline-variant flex justify-between items-center w-full px-4 h-12 shrink-0 z-50 select-none shadow-md"
        data-label={testId}
      >
        <div className="flex items-center gap-2.5" data-label={`${testId}-left`}>
          <div
            className="w-7 h-7 rounded bg-primary/20 text-primary flex items-center justify-center font-bold shadow-[0_0_12px_rgba(255,108,55,0.3)] hover:bg-primary/30 transition-colors cursor-pointer group relative"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          >
            <Globe size={14} className="group-hover:hidden transition-all" />
            {isCollapsed ? (
              <PanelLeftOpen size={14} className="hidden group-hover:block transition-all text-primary" />
            ) : (
              <PanelLeftClose size={14} className="hidden group-hover:block transition-all text-primary" />
            )}
          </div>
          <span className="font-bold text-sm text-on-surface tracking-tight">
            Workbench <span className="text-primary font-mono text-xs uppercase ml-0.5">UI</span>
          </span>
        </div>

        <div className="flex items-center gap-2" data-label={`${testId}-right`}>
          <button
            type="button"
            onClick={() => setIsConnManagerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded bg-surface-container-highest border border-dialog-border hover:border-primary/60 text-on-surface transition-all shadow-sm active:scale-95"
            title="Manage Backend Connections"
          >
            <Cable size={16} className="text-primary" />
            <span>Connections</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded bg-surface-container-highest border border-dialog-border hover:border-primary/60 text-on-surface transition-all shadow-sm active:scale-95"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <Moon size={14} className={theme === 'dark' ? 'hidden' : 'block'} />
            <Sun size={14} className={theme === 'dark' ? 'block' : 'hidden'} />
          </button>

          <div className="flex items-center gap-1 border-l border-outline-variant pl-2 ml-1">
            {HEADER_ICON_BUTTONS.map((btn) => {
              const BtnIcon = btn.icon
              return (
                <button
                  key={btn.id}
                  type="button"
                  title={btn.title}
                  className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors"
                >
                  <BtnIcon size={14} />
                </button>
              )
            })}
          </div>

          <div
            className="w-7 h-7 rounded-full overflow-hidden border border-dialog-border shrink-0 bg-surface-container-highest ml-1 flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
            title="User Profile"
          >
            {userAvatarUrl ? (
              <img alt="User profile" className="w-full h-full object-cover" src={userAvatarUrl} />
            ) : (
              <User size={14} className="text-on-surface-variant" />
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
