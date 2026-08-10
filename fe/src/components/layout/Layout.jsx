import TopNavBar from './TopNavBar.jsx';
import SideNavBar from './SideNavBar.jsx';
import { useUIStore } from '../../store/uiStore.js';

/**
 * Main layout component matching design
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function Layout({ children, "data-label": testId = "app-layout" }) {
  const { sidebarCollapsed, sidebarWidth } = useUIStore();

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
    </div>
  );
}