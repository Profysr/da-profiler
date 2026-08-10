import { GlobalSearch } from '../ui/GlobalSearch';
import { Zap, PanelLeft, PanelLeftClose, Bell, HelpCircle, User, Activity } from 'lucide-react';
import { useUIStore } from '../../store/uiStore.js';

export default function TopNavBar({ onToggleSidebar, sidebarCollapsed }) {
  const healthStatus = useUIStore((state) => state.healthStatus);

  return (
    <header className="bg-surface border-b border-outline-variant fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-lg h-16 backdrop-blur-md bg-opacity-95" data-label="top-navbar">
      <div className="flex items-center gap-4 md:gap-6" data-label="navbar-left">
        <button
          onClick={onToggleSidebar}
          className="text-on-surface-variant hover:text-on-surface p-1.5 hover:bg-surface-variant rounded-md transition-colors flex items-center justify-center"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!sidebarCollapsed}
          data-label="navbar-menu-btn"
          data-sidebar-collapsed={sidebarCollapsed}
        >
          {sidebarCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>

        <div className="font-headline-sm text-headline-sm font-bold text-primary flex items-center gap-2 select-none" data-label="navbar-logo">
          <div className="w-8 h-8 rounded bg-primary/5 flex items-center justify-center">
            <Zap className="w-5 h-5 fill-primary" />
          </div>
          <span className="hidden sm:inline font-headline-sm tracking-tight text-on-surface">Da Profiler</span>
        </div>

        <div className="hidden sm:block w-48 md:w-72" data-label="navbar-global-search-wrapper">
          <GlobalSearch placeholder="Search endpoints or queries... (⌘K)" data-label="navbar-global-search" />
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4" data-label="navbar-right">
        {/* Backend Connection Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container border border-outline-variant text-[11px] font-medium" data-label="navbar-health-indicator">
          <Activity className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span className="text-on-surface-variant">Backend:</span>
          <span className={healthStatus === 'disconnected' ? 'text-error' : 'text-success font-semibold'}>
            {healthStatus === 'disconnected' ? 'Disconnected' : 'Active'}
          </span>
        </div>

        <div className="flex items-center gap-1 text-on-surface-variant" data-label="navbar-icon-buttons">
          {/* <button className="p-2 hover:text-on-surface hover:bg-surface-variant rounded-md transition-colors relative" aria-label="Notifications" data-label="navbar-notifications-btn">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
          </button>
          <button className="p-2 hover:text-on-surface hover:bg-surface-variant rounded-md transition-colors hidden sm:block" aria-label="Help" data-label="navbar-help-btn">
            <HelpCircle className="w-4 h-4" />
          </button> */}
          <button className="p-2 hover:text-on-surface hover:bg-surface-variant rounded-md transition-colors" aria-label="Account" data-label="navbar-account-btn">
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}