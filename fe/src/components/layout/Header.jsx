// components/layout/Header.jsx
import { Menu, Database, Wifi, WifiOff, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/classNames.js'
import { useUIStore } from '../../store/uiStore.js'
import { useHealth } from '../../hooks/useHealth.js'

/**
 * Header component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function Header({ onToggleSidebar, sidebarCollapsed }) {
  const { healthStatus } = useUIStore()
  const { checkHealth } = useHealth()
  
  const getHealthIndicator = () => {
    if (healthStatus === 'connected') {
      return (
        <span className="flex items-center gap-1.5 text-accent-green" title="Backend connected">
          <Wifi className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs font-medium">Connected</span>
        </span>
      )
    }
    if (healthStatus === 'disconnected') {
      return (
        <span className="flex items-center gap-1.5 text-accent-red" title="Backend disconnected">
          <WifiOff className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs font-medium">Disconnected</span>
        </span>
      )
    }
    return (
      <button
        onClick={checkHealth}
        className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary"
        title="Check connection"
      >
        <Database className="h-4 w-4 animate-pulse" aria-hidden="true" />
        <span className="text-xs font-medium">Checking...</span>
      </button>
    )
  }
  
  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-40 h-14 bg-bg-secondary border-b border-border',
      'flex items-center justify-between px-4',
      'transition-all duration-normal'
    )}>
      {/* Left side - Logo and sidebar toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!sidebarCollapsed}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
        
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6 text-accent-blue" aria-hidden="true" />
          <span className="text-lg font-semibold text-text-primary">Da Profiler</span>
        </div>
      </div>
      
      {/* Right side - Health status */}
      <div className="flex items-center gap-4">
        {getHealthIndicator()}
      </div>
    </header>
  )
}