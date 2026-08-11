// components/layout/SideNavBar.jsx
import { useState, useRef, useCallback, useEffect } from 'react';
import { GlobalSearch } from '../ui/GlobalSearch';
import { RouteFilterChips } from '../ui/RouteFilterChips';
import { RouteCard } from '../ui/RouteCard';
import { useUIStore } from '../../store/uiStore.js';
import { useRoutesStore } from '../../store/routesStore.js';
import { useConnectionsStore } from '../../store/connectionsStore.js';
import { ChevronRight, ChevronLeft, ChevronDown, Layers, FileText, HelpCircle, Globe, Cpu, Zap, Bell } from 'lucide-react';
import { TARGET_KINDS, TARGET_KIND_ORDER } from '../../utils/constants.js';

const KIND_ICONS = {
  view: Globe,
  task: Cpu,
  consumer: Zap,
  signal: Bell,
};

// ============================================================================
// MODULAR SUB-COMPONENTS
// ============================================================================

const ResizeHandle = () => (
  <div 
    className="absolute top-0 right-0 bottom-0 w-1 resize-handle cursor-col-resize hover:bg-primary/30 z-50" 
    data-label="sidebar-resize-handle" 
  />
);

const CollapsedSidebar = ({ sidebarRef, handleMouseDown }) => (
  <aside
    ref={sidebarRef}
    data-label="sidebar-collapsed"
    className="fixed top-16 left-0 bottom-0 z-40 bg-surface-container border-r border-outline-variant transition-all duration-150 overflow-hidden w-16 flex flex-col items-center py-4"
    onMouseDown={handleMouseDown}
    aria-label="Sidebar (collapsed)"
  >
    <ResizeHandle />
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

const UnconnectedSidebar = ({ sidebarRef, sidebarWidth, handleMouseDown }) => (
  <aside
    ref={sidebarRef}
    data-label="sidebar"
    className="bg-surface-container border-r border-outline-variant fixed left-0 top-16 h-[calc(100vh-64px)] flex flex-col z-40 overflow-hidden"
    onMouseDown={handleMouseDown}
    style={{ width: `${sidebarWidth}px` }}
    aria-label="Sidebar"
  >
    <ResizeHandle />
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

const SidebarFooter = () => (
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
);

const TargetItem = ({ target, selectedTarget, onTargetClick }) => {
  const isActive = selectedTarget?.id === target.id;
  let methods = []; // Now an array to hold multiple methods
  let path = target.trigger_spec?.path || '';
  // let hasN1 = false;

  // Extract display properties based on kind
  if (target.kind === 'view') {
    // If methods array exists and has items, use it. Otherwise default to ['GET']
    methods = target.trigger_spec?.methods?.length ? target.trigger_spec.methods : ['GET'];
    path = target.trigger_spec?.path || '';
    // hasN1 = target.static_findings?.some(f => f.type === 'N_PLUS_ONE') || false;
  } else if (target.kind === 'task') {
    methods = ['TASK'];
    path = target.trigger_spec?.task_name || target.name;
  } else if (target.kind === 'consumer') {
    methods = ['WS'];
    path = target.trigger_spec?.consumer || target.name;
  } else if (target.kind === 'signal') {
    methods = ['SIGNAL'];
    path = `${target.trigger_spec?.signal}:${target.trigger_spec?.receiver}` || target.name;
  }

  return (
    <RouteCard
      key={target.id}
      methods={methods} // Passing the array instead of string
      path={path}
      lastRun=""
      time=""
      // hasN1={hasN1}
      isActive={isActive}
      kind={target.kind}
      triggerable={target.triggerable}
      onClick={() => onTargetClick(target)}
      data-label={`target-card-${target.id}`}
      data-target-id={target.id}
      data-target-kind={target.kind}
    />
  );
};

const TargetGroup = ({ kind, kindConfig, targets, isCollapsed, activeFilter, onToggle, selectedTarget, onTargetClick }) => {
  const count = targets.length;
  if (count === 0 && activeFilter !== `kind:${kind}` && activeFilter !== 'all') {
    return null;
  }

  const Icon = KIND_ICONS[kind] || Globe;
  
  // If count is 0, we treat it as collapsed natively to hide the inner list mappings
  const effectivelyCollapsed = count === 0 ? true : isCollapsed;

  return (
    <div className="flex flex-col gap-1" data-kind={kind}>
      <button
        onClick={() => count > 0 && onToggle(kind)}
        disabled={count === 0}
        className={`flex items-center gap-2 px-2 py-1.5 text-xs font-semibold rounded transition-colors ${
          count > 0 
            ? 'text-on-surface-variant hover:text-on-surface cursor-pointer' 
            : 'text-on-surface-variant/50 cursor-default'
        }`}
        aria-expanded={!effectivelyCollapsed}
        aria-label={count > 0 ? `Toggle ${kindConfig.label} category` : `No ${kindConfig.label} available`}
        title={count > 0 ? `Toggle ${kindConfig.label} category` : `No ${kindConfig.label} available`}
      >
        <Icon className={`w-3.5 h-3.5 ${kindConfig.color} ${count === 0 ? 'opacity-50' : ''}`} />
        <span className="flex-1 truncate text-left">{kindConfig.label}</span>
        
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${kindConfig.bgColor} ${kindConfig.borderColor} ${kindConfig.color} ${count === 0 ? 'opacity-50' : ''}`}>
          {count}
        </span>
        
        {/* Only render chevron indicators if there are targets inside to expand */}
        {count > 0 && (
          effectivelyCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
        )}
      </button>

      {!effectivelyCollapsed && count > 0 && (
        <div className="flex flex-col gap-1 pl-6 border-l border-outline-variant/50 ml-3">
          {targets.map(target => (
            <TargetItem 
              key={target.id} 
              target={target} 
              selectedTarget={selectedTarget} 
              onTargetClick={onTargetClick} 
            />
          ))}
        </div>
      )}
    </div>
  );
};
// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SideNavBar() {
  // === STORE HOOKS ===
  const { sidebarCollapsed, sidebarWidth, setSidebarWidth } = useUIStore();
  const { filteredTargets, selectedTarget, selectTarget, searchQuery, setSearchQuery, activeFilter, loading, total } = useRoutesStore();
  const { getActiveConnection } = useConnectionsStore();
  const activeConnection = getActiveConnection();
  
  // === LOCAL STATE ===
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  const handleMouseMoveRef = useRef(null);
  const handleMouseUpRef = useRef(null);

  const [collapsedKinds, setCollapsedKinds] = useState(() => {
    try {
      const saved = localStorage.getItem('dqs.collapsedKinds');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // === EFFECTS ===
  useEffect(() => {
    localStorage.setItem('dqs.collapsedKinds', JSON.stringify(collapsedKinds));
  }, [collapsedKinds]);

  useEffect(() => {
    handleMouseMoveRef.current = handleMouseMove;
    handleMouseUpRef.current = handleMouseUp;
    return () => {
      document.removeEventListener('mousemove', handleMouseMoveRef.current);
      document.removeEventListener('mouseup', handleMouseUpRef.current);
    };
  }, [isResizing, sidebarWidth]);

  // === HANDLERS ===
  const toggleKindCollapsed = useCallback((kind) => {
    setCollapsedKinds(prev => ({ ...prev, [kind]: !prev[kind] }));
  }, []);

  const handleTargetClick = useCallback((target) => {
    console.log("DEBUG: Setting target into the router profile");
    selectTarget(target);
  }, [selectTarget]);

  // === RESIZE LOGIC ===
  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    const newWidth = Math.max(240, Math.min(500, e.clientX));
    setSidebarWidth(newWidth);
  }, [isResizing, setSidebarWidth]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.userSelect = ''; // Restore text selection
    document.body.style.cursor = ''; // Restore cursor
    
    document.removeEventListener('mousemove', handleMouseMoveRef.current);
    document.removeEventListener('mouseup', handleMouseUpRef.current);
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (e.target.classList.contains('resize-handle')) {
      e.preventDefault(); // Prevent text selection during drag
      setIsResizing(true);
      document.body.style.userSelect = 'none'; // Lock text selection globally
      document.body.style.cursor = 'col-resize'; // Lock cursor globally
      
      handleMouseMoveRef.current = handleMouseMove;
      handleMouseUpRef.current = handleMouseUp;
      document.addEventListener('mousemove', handleMouseMoveRef.current);
      document.addEventListener('mouseup', handleMouseUpRef.current);
    }
  }, [handleMouseMove, handleMouseUp]);

  // === DATA PREPARATION ===
  const targetsByKind = filteredTargets.reduce((acc, target) => {
    const kind = target.kind || 'view';
    if (!acc[kind]) acc[kind] = [];
    acc[kind].push(target);
    return acc;
  }, {});

  // === RENDER METHODS ===
  if (sidebarCollapsed) {
    return <CollapsedSidebar sidebarRef={sidebarRef} handleMouseDown={handleMouseDown} />;
  }

  if (!activeConnection) {
    return <UnconnectedSidebar sidebarRef={sidebarRef} sidebarWidth={sidebarWidth} handleMouseDown={handleMouseDown} />;
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
      <ResizeHandle />

      <div className="flex flex-col h-full">
        {/* === HEADER SECTION === */}
        <div className="px-4 py-3.5 border-b border-outline-variant flex-shrink-0" data-label="sidebar-header">
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

        {/* === TARGET LIST SECTION === */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 scrollbar-thin" data-label="sidebar-target-list">
          {loading ? (
            <div className="flex items-center justify-center h-full text-on-surface-variant">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              <span className="ml-2 text-sm">Loading Routes...</span>
            </div>
          ) : total === 0 ? (
            <div className="text-center py-8 text-on-surface-variant flex-1 flex items-center justify-center">
              <div className="text-center">
                <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No Routes found</p>
                <p className="text-xs mt-1">Check your Django project configuration</p>
              </div>
            </div>
          ) : (
            <>
              {TARGET_KIND_ORDER.map(kind => (
                <TargetGroup
                  key={kind}
                  kind={kind}
                  kindConfig={TARGET_KINDS[kind]}
                  targets={targetsByKind[kind] || []}
                  isCollapsed={collapsedKinds[kind]}
                  activeFilter={activeFilter}
                  onToggle={toggleKindCollapsed}
                  selectedTarget={selectedTarget}
                  onTargetClick={handleTargetClick}
                />
              ))}
            </>
          )}
        </div>

        {/* === FOOTER SECTION === */}
        <SidebarFooter />
      </div>
    </aside>
  );
}