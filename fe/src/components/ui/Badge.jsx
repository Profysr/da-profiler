// components/ui/Badge.jsx
import { cn } from '../../utils/classNames.js'
import { METHOD_COLORS } from '../../utils/constants.js'

/**
 * Badge component matching the new design
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function Badge({ children, variant = 'gray', className = '', ...props }) {
  const variants = {
    green: 'badge-green',
    orange: 'badge-orange',
    red: 'badge-red',
    blue: 'badge-blue',
    gray: 'badge-gray',
  }

  // If variant is a method name, use method colors
  if (METHOD_COLORS[variant]) {
    return (
      <span
        className={cn('method-badge', METHOD_COLORS[variant], className)}
        {...props}
      >
        {children}
      </span>
    )
  }

  return (
    <span
      className={cn('badge', variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  )
}

/**
 * Method badge component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function MethodBadge({ method, className = '', ...props }) {
  return <Badge variant={method} className={className} {...props}>
    {method}
  </Badge>
}

/**
 * Status pill component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function StatusPill({ statusCode, className = '', ...props }) {
  let variant = '2xx'
  if (statusCode >= 300 && statusCode < 400) variant = '3xx'
  else if (statusCode >= 400 && statusCode < 500) variant = '4xx'
  else if (statusCode >= 500) variant = '5xx'

  const statusClasses = {
    '2xx': 'status-2xx',
    '3xx': 'status-3xx',
    '4xx': 'status-4xx',
    '5xx': 'status-5xx',
  }

  return (
    <span
      className={cn('status-pill', statusClasses[variant], className)}
      {...props}
    >
      {statusCode || '—'}
    </span>
  )
}