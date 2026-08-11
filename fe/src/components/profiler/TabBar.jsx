// components/profiler/TabBar.jsx
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils/classNames.js'
import { PROFILER_TABS } from '../../utils/constants.js'
import { Bug, Database, AlertTriangle, FileCode, List, Activity, Circle } from 'lucide-react'

const TAB_ICONS = {
  n1: Bug,
  summary: Bug,
  queries: Database,
  sideEffects: AlertTriangle,
  response: FileCode,
  logs: List,
  timeline: Activity,
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
          const IconComponent = TAB_ICONS[tab.id] || Circle

          // if (tab.id === 'n1' || tab.id === 'summary') {
          //   return (
          //     <button
          //       key={tab.id}
          //       onClick={() => onChange(tab.id)}
          //       role="tab"
          //       aria-selected={isActive}
          //       aria-controls={`panel-${tab.id}`}
          //       id={`tab-${tab.id}`}
          //       className={cn(
          //         'tab-btn px-3 md:px-4 py-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors text-xs font-semibold',
          //         isActive
          //           ? 'border-error text-error bg-error-container/10'
          //           : 'border-transparent text-on-surface-variant hover:text-on-surface'
          //       )}
          //     >
          //       <IconComponent className="w-4 h-4" />
          //       {tab.label}
          //     </button>
          //   )
          // }

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              className={cn(
                'tab-btn px-3 md:px-4 py-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors text-xs font-semibold',
                isActive
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              )}
            >
              <IconComponent className="w-4 h-4" />
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