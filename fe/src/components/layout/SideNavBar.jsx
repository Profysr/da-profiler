import { useState, useRef, useCallback, useEffect } from 'react';
import { GlobalSearch } from '../ui/GlobalSearch';
import { RouteFilterChips } from '../ui/RouteFilterChips';
import { RouteCard } from '../ui/RouteCard';
import { useUIStore } from '../../store/uiStore.js';
import { useRoutesStore } from '../../store/routesStore.js';
import { ChevronRight, ChevronLeft, Layers, Plus, FileText, HelpCircle } from 'lucide-react';

const STATIC_ROUTES = [
  { id: 1, method: 'POST', path: '/api/v1/auth/login', lastRun: '2m ago', time: '45ms', params: 0, hasN1: false, isActive: false, name: 'Auth Login', methods: ['POST'] },
  { id: 2, method: 'GET', path: '/api/v1/users', lastRun: '5m ago', time: '120ms', params: 2, hasN1: true, isActive: true, name: 'List Users', methods: ['GET'] },
  { id: 3, method: 'PUT', path: '/api/v1/users/{id}', lastRun: '1h ago', time: '85ms', params: 1, hasN1: false, isActive: false, name: 'Update User', methods: ['PUT'] },
  { id: 4, method: 'DELETE', path: '/api/v1/users/{id}', lastRun: '30m ago', time: '200ms', params: 1, hasN1: false, isActive: false, name: 'Delete User', methods: ['DELETE'] },
  { id: 5, method: 'GET', path: '/api/v1/organizations', lastRun: '10m ago', time: '60ms', params: 1, hasN1: false, isActive: false, name: 'List Orgs', methods: ['GET'] },
  { id: 6, method: 'POST', path: '/api/v1/organizations/{id}/members', lastRun: '1h ago', time: '150ms', params: 2, hasN1: true, isActive: false, name: 'Add Member', methods: ['POST'] },
];

export default function SideNavBar() {
  const { sidebarCollapsed, sidebarWidth, setSidebarWidth } = useUIStore();
  const [isResizing, setIsResizing] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState(2);
  const sidebarRef = useRef(null);

  /* 
   * Dynamic backend store integration (commented out for offline dev testing per user request):
   * 
   * const { routes, filteredRoutes, selectRoute, selectedRoute } = useRoutesStore();
   * const displayRoutes = filteredRoutes && filteredRoutes.length > 0 ? filteredRoutes : STATIC_ROUTES;
   */
  const displayRoutes = STATIC_ROUTES;

  // On mount, set initial route in store so ProfilerPanel has active route context
  useEffect(() => {
    const current = STATIC_ROUTES.find(r => r.id === selectedRouteId) || STATIC_ROUTES[0];
    useRoutesStore.getState().selectRoute(current);
  }, [selectedRouteId]);

  const handleRouteClick = (route) => {
    setSelectedRouteId(route.id);
    useRoutesStore.getState().selectRoute(route);
  };

  const handleMouseMoveRef = useRef(null);
  const handleMouseUpRef = useRef(null);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMoveRef.current);
    document.removeEventListener('mouseup', handleMouseUpRef.current);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    const newWidth = Math.max(240, Math.min(500, e.clientX));
    setSidebarWidth(newWidth);
  }, [isResizing, setSidebarWidth]);

  const handleMouseDown = useCallback((e) => {
    if (e.target.classList.contains('resize-handle')) {
      setIsResizing(true);
      document.addEventListener('mousemove', handleMouseMoveRef.current);
      document.addEventListener('mouseup', handleMouseUpRef.current);
    }
  }, []);

  useEffect(() => {
    handleMouseUpRef.current = handleMouseUp;
    handleMouseMoveRef.current = handleMouseMove;
    return () => {
      document.removeEventListener('mousemove', handleMouseMoveRef.current);
      document.removeEventListener('mouseup', handleMouseUpRef.current);
    };
  }, [handleMouseUp, handleMouseMove]);

  if (sidebarCollapsed) {
    return (
      <aside
        ref={sidebarRef}
        data-label="sidebar-collapsed"
        className="fixed top-16 left-0 bottom-0 z-40 bg-surface-container border-r border-outline-variant transition-all duration-150 overflow-hidden w-16 flex flex-col items-center py-4"
        onMouseDown={handleMouseDown}
        aria-label="Sidebar (collapsed)"
      >
        <div className="absolute top-0 right-0 bottom-0 w-1 resize-handle cursor-col-resize hover:bg-primary/30" />
        <button
          className="p-2.5 rounded-lg hover:bg-surface-variant text-on-surface transition-colors"
          onClick={() => useUIStore.getState().toggleSidebar()}
          aria-label="Expand sidebar"
          title="Expand sidebar"
          data-label="sidebar-expand-btn"
        >
          <ChevronRight className="w-5 h-5 text-primary" />
        </button>
      </aside>
    );
  }

  return (
    <aside
      ref={sidebarRef}
      data-label="sidebar"
      className="bg-surface-container border-r border-outline-variant fixed left-0 top-16 h-[calc(100vh-64px)] flex flex-col z-40 overflow-hidden"
      onMouseDown={handleMouseDown}
      style={{ width: `${sidebarWidth}px` }}
      aria-label="Sidebar"
    >
      <div className="absolute top-0 right-0 bottom-0 w-1 resize-handle cursor-col-resize hover:bg-primary/30" data-label="sidebar-resize-handle" />

      <div className="flex flex-col h-full">
        {/* Header with branding */}
        <div className="px-4 py-3.5 border-b border-outline-variant flex-shrink-0" data-label="sidebar-header">
          <div className="flex items-center justify-between mb-3" data-label="sidebar-brand">
            {/* <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center text-primary border border-outline-variant">
                <Layers className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-headline-sm text-sm font-semibold text-on-surface">Endpoints</div>
                <div className="font-body-sm text-[11px] text-on-surface-variant">API Profiler Routes</div>
              </div>
            </div> */}
            <button
              onClick={() => useUIStore.getState().toggleSidebar()}
              className="p-1 text-on-surface-variant hover:text-on-surface rounded hover:bg-surface-variant transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-2.5" data-label="sidebar-search-filters">
            <GlobalSearch placeholder="Filter routes..." className="bg-surface" data-label="sidebar-search" />
            <RouteFilterChips data-label="sidebar-filter-chips" />
          </div>
        </div>

        {/* Route list */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 scrollbar-thin" data-label="sidebar-route-list">
          {displayRoutes.map(route => {
            const isActive = selectedRouteId === route.id;
            const displayRoute = {
              method: route.method,
              path: route.path,
              lastRun: route.lastRun,
              time: route.time,
              params: route.params,
              hasN1: route.hasN1,
              isActive,
            };
            return (
              <RouteCard
                key={route.id}
                {...displayRoute}
                onClick={() => handleRouteClick(route)}
                data-label={`route-card-${route.id}`}
                data-route-id={route.id}
                data-route-path={route.path}
                data-route-method={route.method}
              />
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-outline-variant flex-shrink-0 bg-surface-container-low" data-label="sidebar-footer">
          {/* <button
            className="w-full border border-primary/50 text-primary font-label-caps text-xs py-2 rounded-md hover:bg-primary/10 transition-all flex justify-center items-center gap-2 mb-2 font-semibold shadow-sm"
            data-label="sidebar-new-profile-btn"
          >
            <Plus className="w-4 h-4" /> New Route Profile
          </button> */}
          <div className="flex justify-between px-1 text-on-surface-variant text-[11px]" data-label="sidebar-links">
            <a className="flex items-center gap-1.5 hover:text-on-surface transition-colors py-1" href="#" data-label="sidebar-docs-link">
              <FileText className="w-3.5 h-3.5" /> Docs
            </a>
            <a className="flex items-center gap-1.5 hover:text-on-surface transition-colors py-1" href="#" data-label="sidebar-support-link">
              <HelpCircle className="w-3.5 h-3.5" /> Support
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}