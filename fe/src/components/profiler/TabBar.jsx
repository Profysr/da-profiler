// components/profiler/TabBar.jsx
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils/classNames.js'
import { PROFILER_TABS } from '../../utils/constants.js'

const TAB_ICONS = {
  n1: 'bug_report',
  queries: 'data_object',
  sideEffects: 'warning',
  response: 'raw_on',
  logs: 'list_alt',
  timeline: 'timeline',
}

/**
 * Tab bar component with animated indicator matching design
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function TabBar({ activeTab, onChange, className = '' }) {
  return (
    <div className={cn('relative', className)}>
      {/* Tab buttons */}
      <div className="flex border-b border-outline-variant bg-surface-container-low px-2 md:px-sm overflow-x-auto hide-scrollbar" role="tablist">
        {PROFILER_TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const icon = TAB_ICONS[tab.id] || 'circle'

          if (tab.id === 'n1') {
            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                className={cn(
                  'tab-btn px-3 md:px-4 py-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors',
                  isActive
                    ? 'border-error text-error bg-error-container/10'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                )}
              >
                <span className="material-symbols-outlined text-[16px]">{icon}</span>
                {tab.label}
              </button>
            )
          }

          if (tab.id === 'queries') {
            const count = 0 // This would come from result
            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                className={cn(
                  'tab-btn px-3 md:px-4 py-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors',
                  isActive
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                )}
              >
                <span className="material-symbols-outlined text-[16px]">{icon}</span>
                {tab.label} {count > 0 && `(${count})`}
              </button>
            )
          }

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              className={cn(
                'tab-btn px-3 md:px-4 py-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors',
                isActive
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              )}
            >
              <span className="material-symbols-outlined text-[16px]">{icon}</span>
              {tab.label}
            </button>
          )
        })}
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
          className={cn('tab-panel p-4 md:p-md bg-surface flex-1 flex flex-col gap-4 md:gap-md overflow-y-auto', className)}
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