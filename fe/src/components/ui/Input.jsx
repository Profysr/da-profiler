// components/ui/Input.jsx
import { cn } from '../../utils/classNames.js'
import { generateId } from '../../utils/formatters.js'

/**
 * Input component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function Input({
  label,
  error,
  hint,
  id,
  className = '',
  ...props
}) {
  const inputId = id || generateId()
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-text-secondary mb-1.5">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn('input', className, error && 'border-accent-red focus:border-accent-red focus:ring-accent-red')}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={`${error ? errorId : ''} ${hint ? hintId : ''}`.trim() || undefined}
        {...props}
      />
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