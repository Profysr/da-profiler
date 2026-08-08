// components/ui/Spinner.jsx
import { cn } from '../../utils/classNames.js'

/**
 * Spinner component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function Spinner({ size = 'md', className = '', ...props }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-10 w-10',
  }
  
  return (
    <svg
      className={cn('animate-spin text-accent-blue', sizeClasses[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

/**
 * Loading dots component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function LoadingDots({ className = '', ...props }) {
  return (
    <div className={cn('flex items-center gap-1', className)} {...props}>
      <span className="animate-bounce [animation-delay:-0.3s]">●</span>
      <span className="animate-bounce [animation-delay:-0.15s]">●</span>
      <span className="animate-bounce">●</span>
    </div>
  )
}

/**
 * Skeleton loader component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={cn('animate-pulse bg-bg-tertiary rounded', className)}
      {...props}
    />
  )
}