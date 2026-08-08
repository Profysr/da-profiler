// components/dashboard/EmptyState.jsx
import { Database, Search, Filter, Play } from 'lucide-react'
import { cn } from '../../utils/classNames.js'

/**
 * Empty state component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function EmptyState({ 
  title = 'No routes found', 
  description = 'No executable endpoints discovered',
  icon: Icon = Database,
  className = '',
  action,
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center h-full p-8 text-center', className)}>
      <div className="mb-4 p-3 bg-bg-tertiary rounded-full text-text-secondary">
        <Icon className="h-8 w-8" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-medium text-text-primary mb-1">{title}</h3>
      <p className="text-text-secondary text-sm mb-4 max-w-xs">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className={cn('btn-secondary text-sm', action.className)}
          disabled={action.disabled}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

/**
 * Profiler empty state
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function ProfilerEmptyState({ className = '' }) {
  return (
    <div className={cn('flex flex-col items-center justify-center h-full p-8 text-center', className)}>
      <div className="mb-4 p-3 bg-bg-tertiary rounded-full text-accent-blue">
        <Play className="h-8 w-8" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-medium text-text-primary mb-1">Ready to Profile</h3>
      <p className="text-text-secondary text-sm mb-4 max-w-xs">
        Select a route from the sidebar, configure parameters, and click Profile Route
      </p>
    </div>
  )
}

/**
 * Error state component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function ErrorState({ 
  title = 'Something went wrong', 
  message, 
  onRetry,
  className = '',
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center h-full p-8 text-center', className)}>
      <div className="mb-4 p-3 bg-accent-red/10 rounded-full text-accent-red">
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-text-primary mb-1">{title}</h3>
      {message && <p className="text-text-secondary text-sm mb-4 max-w-xs">{message}</p>}
      {onRetry && (
        <button onClick={onRetry} className="btn-primary text-sm">
          Try Again
        </button>
      )}
    </div>
  )
}