// components/profiler/ProfilerPanel.jsx
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils/classNames.js'
import { useRoutesStore } from '../../store/routesStore.js'
import { useProfile } from '../../hooks/useProfile.js'
import { ProfilerHeader } from './ProfilerHeader.jsx'
import { ProfilerControls } from './ProfilerControls.jsx'
import { MetricsGrid } from './MetricsGrid.jsx'
import { TabBar, TabPanel } from './TabBar.jsx'
import { N1AnalysisTab } from './N1AnalysisTab.jsx'
import { QueriesTab } from './QueriesTab.jsx'
import { SideEffectsTab } from './SideEffectsTab.jsx'
import { ResponseTab } from './ResponseTab.jsx'
import { ProfilerEmptyState } from '../dashboard/EmptyState.jsx'
import { ErrorState } from '../dashboard/EmptyState.jsx'

/**
 * Profiler error boundary for individual tabs
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
function TabErrorBoundary({ children, fallback }) {
  const [error, setError] = useState(null)
  
  if (error) {
    return fallback || (
      <div className="p-4 text-center">
        <p className="text-accent-red">Failed to render tab</p>
        <button onClick={() => setError(null)} className="mt-2 text-accent-blue hover:underline">
          Try again
        </button>
      </div>
    )
  }
  
  return children
}

/**
 * Profiler panel component - main content area
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function ProfilerPanel() {
  const { selectedRoute, clearSelection } = useRoutesStore()
  const { result, loading, error, runProfile, clearResult } = useProfile()
  const [activeTab, setActiveTab] = useState('n1')
  
  const handleRunProfile = useCallback((payload) => {
    if (!selectedRoute) return
    runProfile({
      route: selectedRoute.path,
      ...payload,
      target_model: selectedRoute.target_model,
      relationships: null,
    })
  }, [selectedRoute, runProfile])
  
  if (!selectedRoute) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full flex items-center justify-center"
      >
        <ProfilerEmptyState />
      </motion.div>
    )
  }
  
  // Prepare tab content
  const tabContent = {
    n1: <N1AnalysisTab result={result} />,
    queries: <QueriesTab result={result} />,
    sideEffects: <SideEffectsTab result={result} />,
    response: <ResponseTab result={result} />,
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Profiler Header */}
      <ProfilerHeader route={selectedRoute} />
      
      {/* Controls */}
      <ProfilerControls
        route={selectedRoute}
        onRun={handleRunProfile}
        loading={loading}
        disabled={loading}
      />
      
      {/* Results Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {error && !result?.sql_queries?.length ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ErrorState
                title={error}
                message="The profiling request failed. Check the backend logs for details."
                onRetry={() => handleRunProfile({ method: 'GET', seed_count: 5, path_params: {}, query_params: {} })}
              />
            </motion.div>
          ) : (
            <>
              {/* Metrics Grid */}
              <motion.div
                key="metrics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <MetricsGrid result={result} />
              </motion.div>
              
              {/* Tab Bar */}
              <motion.div
                key="tabs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <TabBar activeTab={activeTab} onChange={setActiveTab} />
              </motion.div>
              
              {/* Tab Panels */}
              <TabPanel activeTab={activeTab} children={tabContent} />
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}