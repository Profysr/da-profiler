import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useRoutesStore } from '../../store/routesStore.js';
import { useProfile } from '../../hooks/useProfile.js';
import { ProfilerHeader } from './ProfilerHeader.jsx';
import { ProfilerControls } from './ProfilerControls.jsx';
import { MetricsGrid } from './MetricsGrid.jsx';
import { TabBar, TabPanel } from '../ui/Tabs.jsx';
import SummaryPanel from './tabs/SummaryPanel.jsx';
import { QueriesTab } from './tabs/QueriesTab.jsx';
import { SideEffectsTab } from './tabs/SideEffectsTab.jsx';
import { ResponseTab } from './tabs/ResponseTab.jsx';
import { LogsTab } from './tabs/LogsTab.jsx';
import { ProfilerEmptyState } from '../dashboard/EmptyState.jsx';
import { ErrorState } from '../dashboard/EmptyState.jsx';
import { PROFILER_TABS } from '../../utils/constants.js';
import { Button } from '../ui/Button.jsx';
import { cn } from '../../utils/classNames.js';


/**
 * Profiler panel component - main content area (Postman-style)
 */
export function ProfilerPanel({ "data-label": testId = "profiler-panel" }) {
  const { selectedTarget } = useRoutesStore();
  const { result, loading, error, runProfile } = useProfile();
  const [activeTab, setActiveTab] = useState('summary');
  const controlsRef = useRef(null);
  const [resultsHeight, setResultsHeight] = useState(null); // null = flex-1 (default)
  const [isFullScreen, setIsFullScreen] = useState(false);
  const isResizingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartHeightRef = useRef(0);
  const resultsPanelRef = useRef(null);

  const toggleFullScreen = useCallback(() => {
    setIsFullScreen((prev) => !prev);
  }, []);

  const handleResizeMouseDown = useCallback((e) => {
    e.preventDefault();
    isResizingRef.current = true;
    dragStartYRef.current = e.clientY;
    dragStartHeightRef.current = resultsPanelRef.current?.offsetHeight ?? 300;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (e) => {
      if (!isResizingRef.current) return;
      const delta = dragStartYRef.current - e.clientY; // drag up = expand
      const newHeight = Math.max(120, dragStartHeightRef.current + delta);
      setResultsHeight(newHeight);
    };

    const onMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  // Get normalized route info from target
  const getRouteInfo = (target) => {
    if (!target) return { path: '', method: 'GET', methods: ['GET'], target_model: null, triggerable: false };

    if (target.kind === 'view') {
      const methods = target.trigger_spec?.methods || ['GET'];
      return {
        path: target.trigger_spec?.path || '',
        method: methods[0],
        methods,
        target_model: target.trigger_spec?.target_model || null,
        triggerable: target.triggerable,
        path_params: target.trigger_spec?.path_params || [],
      };
    }
    // For non-view kinds, return minimal info (static analysis only)
    return {
      path: target.name || target.id,
      method: target.kind.toUpperCase(),
      methods: [target.kind.toUpperCase()],
      target_model: null,
      triggerable: false,
    };
  };

  const routeInfo = getRouteInfo(selectedTarget);

  // Track which method the user has selected via the header pills
  const [selectedMethod, setSelectedMethod] = useState(routeInfo.method);

  // Reset selected method when a new target is picked
  const prevTargetId = useRef(selectedTarget?.id);
  if (selectedTarget?.id !== prevTargetId.current) {
    prevTargetId.current = selectedTarget?.id;
    // synchronously reset so we don't need an extra render via useEffect
    if (selectedMethod !== routeInfo.method) {
      setSelectedMethod(routeInfo.method);
    }
  }

  const handleMethodChange = useCallback((method) => {
    setSelectedMethod(method);
  }, []);

  // onRun receives the built payload from ProfilerControls
  const handleRunProfile = useCallback((payload) => {
    if (!selectedTarget) return;
    runProfile({
      target_id: selectedTarget.id,
      kind: selectedTarget.kind,
      ...payload,
    });
  }, [selectedTarget, runProfile]);

  // Called by the Execute button in the header — delegates to the controls ref
  const handleHeaderExecute = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.run();
    }
  }, []);

  // if no route is selected, show empty page
  if (!selectedTarget) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full flex items-center justify-center"
        data-label={`${testId}-empty-state`}
      >
        <ProfilerEmptyState />
      </motion.div>
    );
  }

  // For non-triggerable targets, show static analysis only
  if (!routeInfo.triggerable) {
    return (
      <div className="h-full flex flex-col overflow-hidden" data-label={testId}>
        <ProfilerHeader
          route={{ ...routeInfo, kind: selectedTarget.kind, staticOnly: true }}
          onRun={handleHeaderExecute}
          loading={loading}
          selectedMethod={selectedMethod}
          onMethodChange={handleMethodChange}
          data-label={`${testId}-header`}
        />
        <div className="flex-1 overflow-y-auto p-4" data-label={`${testId}-results-area`}>
          {result?.static_findings?.length ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">Static Analysis Findings</h3>
              <div className="space-y-3">
                {result.static_findings.map((finding, i) => (
                  <div key={i} className="p-4 bg-surface border border-outline-variant rounded-lg">
                    <div className="font-mono text-sm text-primary mb-2">{finding.type || 'Issue'}</div>
                    <div className="text-on-surface">{finding.message || finding.suggestion || JSON.stringify(finding)}</div>
                    {finding.source_location && (
                      <div className="text-xs text-on-surface-variant mt-2 font-mono">{finding.source_location}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-on-surface-variant">
              <div className="text-4xl mb-2">📋</div>
              <p className="text-lg">Static analysis only</p>
              <p className="text-sm mt-1">This target type cannot be executed. Showing static findings.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const tabContent = {
    summary: <SummaryPanel result={result} data-label={`${testId}-summary-panel`} />,
    queries: <QueriesTab result={result} data-label={`${testId}-queries-tab`} />,
    sideEffects: <SideEffectsTab result={result} data-label={`${testId}-side-effects-tab`} />,
    response: <ResponseTab result={result} data-label={`${testId}-response-tab`} />,
    logs: <LogsTab result={result} data-label={`${testId}-logs-tab`} />,
    timeline: <div className="text-on-surface p-4" data-label={`${testId}-timeline-tab`}>Timeline Panel — coming soon</div>,
  };

  return (
    <div className="h-full flex flex-col overflow-hidden relative" data-label={testId}>

      {/* Header: method pills + path + Execute button */}
      <ProfilerHeader
        route={routeInfo}
        onRun={handleHeaderExecute}
        loading={loading}
        selectedMethod={selectedMethod}
        onMethodChange={handleMethodChange}
        data-label={`${testId}-header`}
      />

      {/* Controls: Path Params / Query Params tables */}
      {!isFullScreen && (
        <ProfilerControls
          ref={controlsRef}
          route={routeInfo}
          onRun={handleRunProfile}
          loading={loading}
          disabled={loading}
          selectedMethod={selectedMethod}
          data-label={`${testId}-controls`}
        />
      )}

      {/* Resize Handle / Bar */}
      <div
        onMouseDown={!isFullScreen ? handleResizeMouseDown : undefined}
        data-label={`${testId}-resize-handle`}
        title={isFullScreen ? undefined : "Drag to resize results panel"}
        className={cn(
          "group shrink-0 flex items-center justify-between px-3 py-1 bg-surface-container border-y border-outline-variant/50 transition-colors relative z-10",
          !isFullScreen && "cursor-row-resize hover:bg-primary/10"
        )}
      >
        {/* visual grip dots */}
        <div className="flex gap-0.5 opacity-40 group-hover:opacity-80 transition-opacity items-center">
          {!isFullScreen && (
            <>
              <div className="w-1 h-1 rounded-full bg-on-surface-variant" />
              <div className="w-1 h-1 rounded-full bg-on-surface-variant" />
              <div className="w-1 h-1 rounded-full bg-on-surface-variant" />
              <div className="w-1 h-1 rounded-full bg-on-surface-variant" />
              <div className="w-1 h-1 rounded-full bg-on-surface-variant" />
            </>
          )}
          <span className="text-[10px] font-label-caps uppercase tracking-wider text-on-surface-variant/70 ml-2">
            Results
          </span>
        </div>

        {/* Fullscreen Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleFullScreen}
          icon={isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          title={isFullScreen ? "Exit Full Screen" : "Full Screen Results"}
          aria-label={isFullScreen ? "Exit Full Screen" : "Full Screen Results"}
          className="text-on-surface-variant hover:text-primary p-1 h-6 text-[11px] gap-1"
        >
          <span>{isFullScreen ? "Minimize" : "Full Screen"}</span>
        </Button>
      </div>

      {/* Results Area */}
      <div
        ref={resultsPanelRef}
        className={cn(
          "overflow-y-auto",
          isFullScreen
            ? "flex-1 bg-background"
            : resultsHeight !== null
            ? "shrink-0"
            : "flex-1"
        )}
        style={!isFullScreen && resultsHeight !== null ? { height: resultsHeight } : undefined}
        data-label={`${testId}-results-area`}
      >
        <AnimatePresence mode="wait">
          {error && !result?.queries?.length ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              data-label={`${testId}-error-state`}
            >
              <ErrorState
                title={error}
                message="The profiling request failed. Check the backend logs for details."
                onRetry={() => controlsRef.current?.run()}
              />
            </motion.div>
          ) : (
            <>
              <motion.div
                key="metrics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-4"
                data-label={`${testId}-metrics-wrapper`}
              >
                <MetricsGrid result={result} data-label={`${testId}-metrics-grid`} />
              </motion.div>

              <motion.div
                key="tabs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                data-label={`${testId}-tab-bar-wrapper`}
              >
                <TabBar tabs={PROFILER_TABS} activeTabId={activeTab} onTabChange={setActiveTab} data-label={`${testId}-tab-bar`} />
              </motion.div>

              <TabPanel isActive={true} children={tabContent[activeTab]} data-label={`${testId}-tab-panel`} />
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}