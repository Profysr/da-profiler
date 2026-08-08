// components/dashboard/RouteFilters.jsx
import { cn } from '../../utils/classNames.js'
import { ROUTE_FILTERS } from '../../utils/constants.js'

/**
 * Route filter chips component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function RouteFilters({ activeFilter, onChange, disabled = false }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Route filters">
      {ROUTE_FILTERS.map((filter) => (
        <button
          key={filter.value}
          onClick={() => !disabled && onChange(filter.value)}
          disabled={disabled}
          className={cn(
            'filter-chip',
            'px-3 py-1.5 text-xs font-medium rounded-full',
            'transition-all duration-fast',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            activeFilter === filter.value
              ? 'bg-accent-blue text-white border-accent-blue'
              : 'bg-bg-tertiary text-text-secondary border border-border hover:bg-bg-tertiary/80 hover:text-text-primary'
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