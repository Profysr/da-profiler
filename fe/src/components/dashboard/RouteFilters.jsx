// components/dashboard/RouteFilters.jsx
import { cn } from '../../utils/classNames.js'
import { ROUTE_FILTERS } from '../../utils/constants.js'

/**
 * Route filter chips component matching design
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function RouteFilters({ activeFilter, onChange, disabled = false }) {
  return (
    <div className="flex gap-2 flex-wrap" role="group" aria-label="Route filters">
      {ROUTE_FILTERS.map((filter) => (
        <button
          key={filter.value}
          onClick={() => !disabled && onChange(filter.value)}
          disabled={disabled}
          className={cn(
            'rounded-full px-2 py-0.5 font-label-caps text-label-caps cursor-pointer transition-colors',
            activeFilter === filter.value
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'bg-surface-variant text-on-surface border border-outline-variant hover:bg-surface-bright'
          )}
          role="radio"
          aria-checked={activeFilter === filter.value}
          aria-label={filter.label}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}