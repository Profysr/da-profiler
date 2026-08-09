// components/dashboard/EmptyState.jsx
import { cn } from '../../utils/classNames.js'

/**
 * Empty state component matching design
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function EmptyState({
  title = 'No routes found',
  description = 'No executable endpoints discovered',
  icon,
  className = '',
  action,
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center h-full p-8 text-center', className)}>
      {icon && (
        <div className="mb-4 p-3 bg-surface-variant rounded-full text-on-surface-variant">
          {icon}
        </div>
      )}
      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">{title}</h3>
      <p className="font-body-sm text-body-sm text-on-surface-variant mb-4 max-w-xs">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className={cn('btn-secondary text-body-sm font-label-caps text-label-caps', action.className)}
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
      <div className="mb-4 p-3 bg-surface-variant rounded-full text-primary">
        <span className="material-symbols-outlined h-8 w-8" aria-hidden="true">play_arrow</span>
      </div>
      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">Ready to Profile</h3>
      <p className="font-body-sm text-body-sm text-on-surface-variant mb-4 max-w-xs">
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
      <div className="mb-4 p-3 bg-error-container/10 rounded-full text-error">
        <span className="material-symbols-outlined h-8 w-8" aria-hidden="true">error</span>
      </div>
      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">{title}</h3>
      {message && <p className="font-body-sm text-body-sm text-on-surface-variant mb-4 max-w-xs">{message}</p>}
      {onRetry && (
        <button onClick={onRetry} className="btn-primary font-label-caps text-label-caps text-body-sm">
          Try Again
        </button>
      )}
    </div>
  )
}