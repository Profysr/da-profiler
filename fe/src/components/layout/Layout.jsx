import { useEffect, useState } from 'react';
import TopNavBar from './TopNavBar.jsx';
import SideNavBar from './SideNavBar.jsx';
import { ConnectionManager } from '../ConnectionManager.jsx';
import { useUIStore } from '../../store/uiStore.js';

/**
 * Main layout component matching design spec. Contains top nav, side nav, and main content area.
 */
export function Layout({ children, "data-label": testId = "app-layout" }) {
  const { sidebarCollapsed, sidebarWidth } = useUIStore();
  const [showConnections, setShowConnections] = useState(false);

  useEffect(() => {
    function handleOpenConnections() {
      setShowConnections(true);
    }
    window.addEventListener('dqs:open-connections', handleOpenConnections);
    return () => window.removeEventListener('dqs:open-connections', handleOpenConnections);
  }, []);

  return (
    <div className="bg-background text-on-surface h-screen w-screen overflow-hidden flex flex-col font-body-md" data-label={testId} data-sidebar-collapsed={sidebarCollapsed}>
      <TopNavBar
        onToggleSidebar={() => useUIStore.getState().toggleSidebar()}
        sidebarCollapsed={sidebarCollapsed}
        data-label={`${testId}-top-navbar`}
      />

      <div className="flex flex-1 pt-16 h-[calc(100vh-64px)] w-full overflow-hidden" data-label={`${testId}-content-area`}>
        <SideNavBar data-label={`${testId}-side-navbar`} />
        <main
          className="flex-1 flex flex-col h-full overflow-hidden bg-background transition-all duration-150"
          style={{ marginLeft: sidebarCollapsed ? '64px' : `${sidebarWidth}px` }}
          data-label={`${testId}-main-content`}
        >
          {children}
        </main>
      </div>

      <ConnectionManager isOpen={showConnections} onClose={() => setShowConnections(false)} />
    </div>
  );
}