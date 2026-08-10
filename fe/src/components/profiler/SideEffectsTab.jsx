// components/profiler/SideEffectsTab.jsx
import { AlertTriangle, Shield } from 'lucide-react'
import { cn } from '../../utils/classNames.js'
import { EmptyState } from '../dashboard/EmptyState.jsx'

/**
 * Side effects tab component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function SideEffectsTab({ result }) {
  const warnings = result?.side_effect_warnings || []
  
  if (!result || warnings.length === 0) {
    return (
      <EmptyState
        title="No Side Effect Warnings"
        description="No blocking calls or external I/O patterns detected."
        icon={<Shield className="h-8 w-8 text-success" aria-hidden="true" />}
      />
    )
  }
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
        <AlertTriangle className="h-4 w-4 text-accent-orange" aria-hidden="true" />
        <span>{warnings.length} warning{warnings.length !== 1 ? 's' : ''} detected</span>
      </div>
      
      <div className="space-y-2">
        {warnings.map((warning, index) => (
          <div
            key={index}
            className={cn(
              'p-3 bg-bg-secondary border border-border rounded-lg',
              'border-l-3 border-accent-orange'
            )}
          >
            <p className="font-mono text-sm text-text-primary">{warning}</p>
          </div>
        ))}
      </div>
    </div>
  )
}