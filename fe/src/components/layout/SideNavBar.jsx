// components/layout/SideNavBar.jsx
import { useState, useRef, useCallback, useEffect } from 'react';
import { GlobalSearch } from '../ui/GlobalSearch';
import { RouteFilterChips } from '../ui/RouteFilterChips';
import { RouteCard } from '../ui/RouteCard';
import { useUIStore } from '../../store/uiStore.js';
import { useRoutesStore } from '../../store/routesStore.js';
import { useConnectionsStore } from '../../store/connectionsStore.js';
import { ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Layers, Plus, FileText, HelpCircle, Globe, Cpu, Zap, Bell } from 'lucide-react';
import { TARGET_KINDS, TARGET_KIND_ORDER } from '../../utils/constants.js';

const KIND_ICONS = {
  view: Globe,
  task: Cpu,
  consumer: Zap,
  signal: Bell,
};

export default function SideNavBar() {
  const { sidebarCollapsed, sidebarWidth, setSidebarWidth } = useUIStore();
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  
  // Routes store
  const { filteredTargets, selectedTarget, selectTarget, searchQuery, setSearchQuery, activeFilter, setActiveFilter, loading, counts, total, fetchTargets } = useRoutesStore();
  
  // Connections store
  const { getActiveConnection } = useConnectionsStore();
  const activeConnection = getActiveConnection();
  
  // Local state for collapsed kind sections
  const [collapsedKinds, setCollapsedKinds] = useState(() => {
    try {
      const saved = localStorage.getItem('dqs.collapsedKinds');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Persist collapsed kinds
  useEffect(() => {
    localStorage.setItem('dqs.collapsedKinds', JSON.stringify(collapsedKinds));
  }, [collapsedKinds]);

  const toggleKindCollapsed = useCallback((kind) => {
    setCollapsedKinds(prev => ({ ...prev, [kind]: !prev[kind] }));
  }, []);

  // Group targets by kind
  const targetsByKind = filteredTargets.reduce((acc, target) => {
    const kind = target.kind || 'view';
    if (!acc[kind]) acc[kind] = [];
    acc[kind].push(target);
    return acc;
  }, {});

  const handleTargetClick = useCallback((target) => {
    console.log("DEBUG: Setting target into the router profile");
    selectTarget(target);
  }, [selectTarget]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMoveRef.current);
    document.removeEventListener('mouseup', handleMouseUpRef.current);
  }, []);

  const handleMouseMoveRef = useRef(null);
  const handleMouseUpRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    const newWidth = Math.max(240, Math.min(500, e.clientX));
    setSidebarWidth(newWidth);
  }, [isResizing, setSidebarWidth]);

  const handleMouseDown = useCallback((e) => {
    if (e.target.classList.contains('resize-handle')) {
      setIsResizing(true);
      handleMouseMoveRef.current = handleMouseMove;
      handleMouseUpRef.current = handleMouseUp;
      document.addEventListener('mousemove', handleMouseMoveRef.current);
      document.addEventListener('mouseup', handleMouseUpRef.current);
    }
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    handleMouseMoveRef.current = handleMouseMove;
    handleMouseUpRef.current = handleMouseUp;
    return () => {
      document.removeEventListener('mousemove', handleMouseMoveRef.current);
      document.removeEventListener('mouseup', handleMouseUpRef.current);
    };
  }, [handleMouseMove, handleMouseUp]);

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

  // No active connection
  if (!activeConnection) {
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
          <div className="px-4 py-3.5 border-b border-outline-variant flex-shrink-0" data-label="sidebar-header">
            <div className="flex items-center justify-between mb-3" data-label="sidebar-brand">
              <button
                onClick={() => useUIStore.getState().toggleSidebar()}
                className="p-1 text-on-surface-variant hover:text-on-surface rounded hover:bg-surface-variant transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center py-8 text-on-surface-variant">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">No project connected</p>
              <p className="text-xs mt-1">Select a project from the toolbar</p>
            </div>
          </div>
        </div>
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
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-outline-variant flex-shrink-0" data-label="sidebar-header">
          {/* <div className="flex items-center justify-between mb-3" data-label="sidebar-brand">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center text-primary border border-outline-variant">
                <Layers className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="font-headline-sm text-sm font-semibold text-on-surface">{activeConnection.name}</div>
                <div className="font-body-sm text-[11px] text-on-surface-variant truncate max-w-[200px]">{activeConnection.baseUrl}</div>
              </div>
            </div>
            <button
              onClick={() => useUIStore.getState().toggleSidebar()}
              className="p-1 text-on-surface-variant hover:text-on-surface rounded hover:bg-surface-variant transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div> */}

          <div className="flex flex-col gap-2.5" data-label="sidebar-search-filters">
            <GlobalSearch
              placeholder="Filter targets..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="bg-surface"
              data-label="sidebar-search"
            />
            <RouteFilterChips data-label="sidebar-filter-chips" />
          </div>
        </div>

        {/* Target list grouped by kind */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 scrollbar-thin" data-label="sidebar-target-list">
          {loading ? (
            <div className="flex items-center justify-center h-full text-on-surface-variant">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              <span className="ml-2 text-sm">Loading targets...</span>
            </div>
          ) : total === 0 ? (
            <div className="text-center py-8 text-on-surface-variant flex-1 flex items-center justify-center">
              <div className="text-center">
                <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No targets found</p>
                <p className="text-xs mt-1">Check your Django project configuration</p>
              </div>
            </div>
          ) : (
            <>
              {TARGET_KIND_ORDER.map(kind => {
                const kindConfig = TARGET_KINDS[kind];
                const targets = targetsByKind[kind] || [];
                const count = targets.length;
                const isCollapsed = collapsedKinds[kind];
                
                if (count === 0 && activeFilter !== `kind:${kind}` && activeFilter !== 'all') {
                  return null;
                }

                const Icon = KIND_ICONS[kind] || Globe;

                return (
                  <div key={kind} className="flex flex-col gap-1" data-kind={kind}>
                    <button
                      onClick={() => toggleKindCollapsed(kind)}
                      className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface rounded transition-colors"
                      aria-expanded={!isCollapsed}
                    >
                      <Icon className={`w-3.5 h-3.5 ${kindConfig.color}`} />
                      <span className="flex-1 truncate text-left">{kindConfig.label}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${kindConfig.bgColor} ${kindConfig.borderColor} ${kindConfig.color}`}>
                        {count}
                      </span>
                      {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {!isCollapsed && count > 0 && (
                      <div className="flex flex-col gap-1 pl-6 border-l border-outline-variant/50 ml-3">
                        {targets.map(target => {
                          const isActive = selectedTarget?.id === target.id;
                          
                          // Extract display properties based on kind
                          let method = '';
                          let path = target.trigger_spec?.path || '';
                          let hasN1 = false;
                          let lastRun = '';
                          let time = '';
                          let paramsCount = 0;

                          if (target.kind === 'view') {
                            method = target.trigger_spec?.methods?.[0] || 'GET';
                            path = target.trigger_spec?.path || '';
                            paramsCount = target.trigger_spec?.path_params?.length || 0;
                            hasN1 = target.static_findings?.some(f => f.type === 'N_PLUS_ONE') || false;
                          } else if (target.kind === 'task') {
                            method = 'TASK';
                            path = target.trigger_spec?.task_name || target.name;
                          } else if (target.kind === 'consumer') {
                            method = 'WS';
                            path = target.trigger_spec?.consumer || target.name;
                          } else if (target.kind === 'signal') {
                            method = 'SIGNAL';
                            path = `${target.trigger_spec?.signal}:${target.trigger_spec?.receiver}` || target.name;
                          }

                          return (
                            <RouteCard
                              key={target.id}
                              method={method}
                              path={path}
                              lastRun={lastRun}
                              time={time}
                              params={paramsCount}
                              hasN1={hasN1}
                              isActive={isActive}
                              kind={target.kind}
                              triggerable={target.triggerable}
                              onClick={() => handleTargetClick(target)}
                              data-label={`target-card-${target.id}`}
                              data-target-id={target.id}
                              data-target-kind={target.kind}
                            />
                          );
                        })}
                      </div>
                    )}

                    {!isCollapsed && count === 0 && (
                      <div className="px-2 py-3 text-center text-on-surface-variant/60 text-xs pl-6 border-l border-outline-variant/50 ml-3">
                        No {kindConfig.shortLabel.toLowerCase()} found
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-outline-variant flex-shrink-0 bg-surface-container-low" data-label="sidebar-footer">
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