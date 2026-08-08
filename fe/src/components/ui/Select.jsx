// components/ui/Select.jsx
import { cn } from '../../utils/classNames.js'
import { generateId } from '../../utils/formatters.js'

/**
 * Select component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function Select({
  label,
  error,
  hint,
  options = [],
  placeholder,
  id,
  className = '',
  ...props
}) {
  const selectId = id || generateId()
  const errorId = `${selectId}-error`
  const hintId = `${selectId}-hint`
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-medium text-text-secondary mb-1.5">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn('select', className, error && 'border-accent-red focus:border-accent-red focus:ring-accent-red')}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={`${error ? errorId : ''} ${hint ? hintId : ''}`.trim() || undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-accent-red" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-text-secondary">
          {hint}
        </p>
      )}
    </div>
  )
}