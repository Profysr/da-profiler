// components/ui/Input.jsx
import { cn } from '../../utils/classNames.js'
import { generateId } from '../../utils/formatters.js'

/**
 * Input component matching the design - uses wrapper with borderless input inside
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function Input({
  label,
  error,
  hint,
  id,
  className = '',
  wrapperClassName = '',
  ...props
}) {
  const inputId = id || generateId()
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`

  return (
    <div className={cn('w-full', wrapperClassName)}>
      {label && (
        <label htmlFor={inputId} className="block font-label-caps text-label-caps text-on-surface-variant mb-1.5">
          {label}
        </label>
      )}
      <div className={cn(
        'input-wrapper flex items-center bg-surface-container border border-outline-variant rounded px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary',
        error && 'border-error focus-within:ring-error',
        className
      )}>
        <input
          id={inputId}
          className="input bg-transparent border-none outline-none text-body-sm font-body-sm text-on-surface placeholder:text-on-surface-variant w-full p-0 focus:ring-0"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={`${error ? errorId : ''} ${hint ? hintId : ''}`.trim() || undefined}
          {...props}
        />
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-body-sm text-error" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-body-sm text-on-surface-variant">
          {hint}
        </p>
      )}
    </div>
  )
}