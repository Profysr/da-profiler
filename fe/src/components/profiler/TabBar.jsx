// components/profiler/TabBar.jsx
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils/classNames.js'
import { PROFILER_TABS } from '../../utils/constants.js'

/**
 * Tab bar component with animated indicator
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function TabBar({ activeTab, onChange, className = '' }) {
  return (
    <div className={cn('relative', className)}>
      {/* Animated indicator */}
      <AnimatePresence mode="wait">
        {PROFILER_TABS.map((tab) => (
          <motion.div
            key={tab.id}
            layoutId="tab-indicator"
            className={cn(
              'absolute bottom-0 h-0.5 bg-accent-blue',
              activeTab === tab.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        ))}
      </AnimatePresence>
      
      {/* Tab buttons */}
      <div className="flex border-b border-border" role="tablist">
        {PROFILER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={cn(
              'tab-btn relative px-4 py-3 text-sm font-medium transition-all duration-fast',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
              activeTab === tab.id
                ? 'text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {tab.label}
            <span className="ml-2" />
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Tab panel wrapper with animation
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function TabPanel({ activeTab, children, className = '' }) {
  return (
    <AnimatePresence mode="wait">
      {PROFILER_TABS.map((tab) => (
        <motion.div
          key={tab.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={cn('tab-panel', className)}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
        >
          {activeTab === tab.id && children[tab.id]}
        </motion.div>
      ))}
    </AnimatePresence>
  )
}