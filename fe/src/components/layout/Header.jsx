// components/layout/Header.jsx
import { cn } from '../../utils/classNames.js'
import { useUIStore } from '../../store/uiStore.js'
import { useHealth } from '../../hooks/useHealth.js'

/**
 * Header component matching the TopNavBar design
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function Header({ onToggleSidebar, sidebarCollapsed }) {
  const { healthStatus } = useUIStore()
  const { checkHealth } = useHealth()

  const getHealthIndicator = () => {
    if (healthStatus === 'connected') {
      return (
        <span className="flex items-center gap-1.5 text-on-surface-variant" title="Backend connected">
          <span className="material-symbols-outlined text-[16px]">wifi</span>
          <span className="font-label-caps text-label-caps hidden sm:inline">Connected</span>
        </span>
      )
    }
    if (healthStatus === 'disconnected') {
      return (
        <span className="flex items-center gap-1.5 text-error" title="Backend disconnected">
          <span className="material-symbols-outlined text-[16px]">wifi_off</span>
          <span className="font-label-caps text-label-caps hidden sm:inline">Disconnected</span>
        </span>
      )
    }
    return (
      <button
        onClick={checkHealth}
        className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors"
        title="Check connection"
      >
        <span className="material-symbols-outlined text-[16px] animate-pulse">database</span>
        <span className="font-label-caps text-label-caps hidden sm:inline">Checking...</span>
      </button>
    )
  }

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 h-16 bg-surface border-b border-outline-variant',
      'flex items-center justify-between px-4 md:px-lg',
      'transition-all duration-normal'
    )}>
      {/* Left side - Menu button, Logo, Global Search */}
      <div className="flex items-center gap-4 md:gap-xl">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden text-on-surface p-1 hover:bg-surface-variant rounded transition-colors"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!sidebarCollapsed}
        >
          <span className="material-symbols-outlined">{sidebarCollapsed ? 'menu_open' : 'menu'}</span>
        </button>

        <div className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          <span className="hidden sm:inline">Da Profiler</span>
        </div>

        <div className="hidden sm:flex items-center bg-surface-container border border-outline-variant rounded px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary w-48 md:w-64">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px] mr-2">search</span>
          <input
            className="input bg-transparent border-none outline-none text-body-sm font-body-sm text-on-surface placeholder:text-on-surface-variant w-full p-0 focus:ring-0"
            placeholder="Global search..."
            type="text"
          />
        </div>
      </div>

      {/* Navigation - Desktop only */}
      <nav className="hidden lg:flex items-center h-full gap-md">
        <a className="h-full flex items-center px-2 font-label-caps text-label-caps text-on-surface-variant hover:bg-surface-variant transition-colors" href="#">
          Dashboard
        </a>
        <a className="h-full flex items-center px-2 font-label-caps text-label-caps text-on-surface-variant hover:bg-surface-variant transition-colors" href="#">
          Analytics
        </a>
        <a className="h-full flex items-center px-2 font-label-caps text-label-caps text-on-surface-variant hover:bg-surface-variant transition-colors" href="#">
          Settings
        </a>
      </nav>

      {/* Right side - Profile Route button, Notifications, Help, Account */}
      <div className="flex items-center gap-2 md:gap-4">
        <button className="hidden sm:block bg-primary text-on-primary font-label-caps text-label-caps px-4 py-2 rounded font-bold hover:bg-primary-fixed transition-colors">
          Profile Route
        </button>
        <div className="flex items-center gap-1 md:gap-2 text-on-surface-variant">
          <button className="p-1 hover:text-on-surface transition-colors" aria-label="Notifications">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-1 hover:text-on-surface transition-colors hidden sm:block" aria-label="Help">
            <span className="material-symbols-outlined">help</span>
          </button>
          <button className="p-1 hover:text-on-surface transition-colors" aria-label="Account">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </div>
    </header>
  )
}