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
  const { selectedRoute } = useRoutesStore();
  const { result, loading, error, runProfile } = useProfile();
  const [activeTab, setActiveTab] = useState('summary');
  const controlsRef = useRef(null);

  // onRun receives the built payload from ProfilerControls
  const handleRunProfile = useCallback((payload) => {
    if (!selectedRoute) return;
    runProfile({
      route: selectedRoute.path,
      ...payload,
      target_model: selectedRoute.target_model,
      relationships: null,
    });
  }, [selectedRoute, runProfile]);

  // Called by the Execute button in the header — delegates to the controls ref
  const handleHeaderExecute = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.run();
    }
  }, []);

  if (!selectedRoute) {
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
        route={selectedRoute}
        onRun={handleHeaderExecute}
        loading={loading}
        data-label={`${testId}-header`}
      />

      {/* Controls: Path Params / Query Params tables */}
      <ProfilerControls
        ref={controlsRef}
        route={selectedRoute}
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