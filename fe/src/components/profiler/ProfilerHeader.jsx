// components/profiler/ProfilerHeader.jsx
import { cn } from '../../utils/classNames.js'
import { MethodBadge } from '../ui/Badge.jsx'

/**
 * Profiler header component showing selected route info
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function ProfilerHeader({ route }) {
  if (!route) return null
  
  const methods = route.methods || ['GET']
  
  return (
    <div className="p-4 bg-bg-secondary border-b border-border">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="font-mono text-lg font-medium text-text-primary truncate mb-2">
            {route.path}
          </div>
          <div className="flex items-center flex-wrap gap-2">
            {methods.map((method) => (
              <MethodBadge key={method} method={method} />
            ))}
            {route.view_type && (
              <span className="px-2 py-0.5 text-xs font-medium bg-bg-tertiary text-text-secondary border border-border rounded">
                {route.view_type}
              </span>
            )}
            {route.target_model && (
              <span className="px-2 py-0.5 text-xs font-mono bg-bg-tertiary text-text-secondary border border-border rounded">
                {route.target_model}
              </span>
            )}
            <span className={cn(
              'px-2 py-0.5 text-xs font-medium rounded',
              route.executable 
                ? 'bg-accent-green/15 text-accent-green' 
                : 'bg-accent-red/15 text-accent-red'
            )}>
              {route.executable ? '✓ Executable' : '✗ Not executable'}
            </span>
          </div>
        </div>
        
        {route.reason_unexecutable && !route.executable && (
          <div className="p-2 bg-accent-red/10 border border-accent-red/20 rounded text-accent-red text-sm max-w-xs">
            {route.reason_unexecutable}
          </div>
        )}
      </div>
    </div>
  )
}