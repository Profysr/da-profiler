// components/dashboard/RouteSearch.jsx
import { cn } from '../../utils/classNames.js'
import { Search, X } from 'lucide-react'

/**
 * Route search input component matching design
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function RouteSearch({ value, onChange, disabled = false, placeholder = 'Search routes...' }) {
  const handleClear = () => {
    onChange('')
    const input = document.getElementById('route-search-input')
    if (input) input.focus()
  }

  return (
    <div className="flex items-center bg-surface border border-outline-variant rounded-md px-3 py-2 focus-within:ring-1 focus-within:ring-primary shadow-sm">
      <Search className="w-4 h-4 text-on-surface-variant mr-2 flex-shrink-0" />
      <input
        id="route-search-input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="input bg-transparent border-none outline-none text-body-sm font-body-sm text-on-surface placeholder:text-on-surface-variant w-full p-0 focus:ring-0"
        aria-label="Search routes"
        autoComplete="off"
      />
      {value && (
        <button
          onClick={handleClear}
          className="p-1 hover:text-on-surface transition-colors text-on-surface-variant rounded hover:bg-surface-variant"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}