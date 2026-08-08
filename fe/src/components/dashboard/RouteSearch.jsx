// components/dashboard/RouteSearch.jsx
import { Search, X } from 'lucide-react'
import { cn } from '../../utils/classNames.js'

/**
 * Route search input component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function RouteSearch({ value, onChange, disabled = false, placeholder = 'Search routes...' }) {
  const handleClear = () => {
    onChange('')
    // Focus the input after clearing
    const input = document.getElementById('route-search-input')
    if (input) input.focus()
  }
  
  return (
    <div className="relative mb-3">
      <Search 
        className={cn(
          'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4',
          'text-text-secondary'
        )} 
        aria-hidden="true" 
      />
      <input
        id="route-search-input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          'input pl-10 pr-10',
          'placeholder:text-text-secondary/60'
        )}
        aria-label="Search routes"
        autoComplete="off"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}