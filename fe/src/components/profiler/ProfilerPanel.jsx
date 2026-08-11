import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoutesStore } from '../../store/routesStore.js';
import { useProfile } from '../../hooks/useProfile.js';
import { ProfilerHeader } from './ProfilerHeader.jsx';
import { ProfilerControls } from './ProfilerControls.jsx';
import { MetricsGrid } from './MetricsGrid.jsx';
import { TabBar, TabPanel } from '../ui/Tabs.jsx';
import SummaryPanel from './SummaryPanel.jsx';
import { QueriesTab } from './QueriesTab.jsx';
import { SideEffectsTab } from './SideEffectsTab.jsx';
import { ResponseTab } from './ResponseTab.jsx';
import { ProfilerEmptyState } from '../dashboard/EmptyState.jsx';
import { ErrorState } from '../dashboard/EmptyState.jsx';
import { Bug, Database, AlertTriangle, FileCode, List, Activity } from 'lucide-react';

const PROFILER_TABS = [
  { id: 'summary', label: 'Summary', icon: Bug, variant: 'error' },
  { id: 'queries', label: 'SQL Queries', icon: Database, variant: 'default' },
  { id: 'sideEffects', label: 'Side Effects', icon: AlertTriangle, variant: 'default' },
  { id: 'response', label: 'Raw Response', icon: FileCode, variant: 'default' },
  { id: 'logs', label: 'Logs', icon: List, variant: 'default' },
  { id: 'timeline', label: 'Timeline', icon: Activity, variant: 'default' },
];

/**
 * Profiler panel component - main content area (Postman-style)
 */
export function ProfilerPanel({ "data-label": testId = "profiler-panel" }) {
  const { selectedTarget } = useRoutesStore();
  const { result, loading, error, runProfile } = useProfile();
  const [activeTab, setActiveTab] = useState('summary');
  const controlsRef = useRef(null);

  // Get normalized route info from target
  const getRouteInfo = (target) => {
    if (!target) return { path: '', method: 'GET', target_model: null, triggerable: false };
    
    if (target.kind === 'view') {
      return {
        path: target.trigger_spec?.path || '',
        method: target.trigger_spec?.methods?.[0] || 'GET',
        target_model: target.trigger_spec?.target_model || null,
        triggerable: target.triggerable,
      };
    }
    // For non-view kinds, return minimal info (static analysis only)
    return {
      path: target.name || target.id,
      method: target.kind.toUpperCase(),
      target_model: null,
      triggerable: false,
    };
  };

  const routeInfo = getRouteInfo(selectedTarget);
  console.log("DEBUG: Selected Target and Route Info", selectedTarget, routeInfo);

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
    logs: <div className="text-on-surface p-4" data-label={`${testId}-logs-tab`}>Logs Panel — coming soon</div>,
    timeline: <div className="text-on-surface p-4" data-label={`${testId}-timeline-tab`}>Timeline Panel — coming soon</div>,
  };

  return (
    <div className="h-full flex flex-col overflow-hidden" data-label={testId}>

      {/* Header: method badge + path + Execute button */}
      <ProfilerHeader
        route={routeInfo}
        onRun={handleHeaderExecute}
        loading={loading}
        data-label={`${testId}-header`}
      />

      {/* Controls: Path Params / Query Params tables */}
      <ProfilerControls
        ref={controlsRef}
        route={routeInfo}
        onRun={handleRunProfile}
        loading={loading}
        disabled={loading}
        data-label={`${testId}-controls`}
      />

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto" data-label={`${testId}-results-area`}>
        <AnimatePresence mode="wait">
          {error && !result?.sql_queries?.length ? (
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