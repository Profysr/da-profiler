import { cn } from '../../utils/classNames.js'

/**
 * Card component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function Card({ children, className = '', hover = false, padding = 'sm', ...props }) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  }
  
  return (
    <div
      className={cn(
        'card border border-outline-variant/40 rounded bg-surface-container/30',
        hover && 'hover:bg-surface-container/60 transition-colors',
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Card header component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={cn('border-b border-outline-variant/30 pb-2.5 mb-2.5', className)} {...props}>
      {children}
    </div>
  )
}

/**
 * Card content component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function CardContent({ children, className = '', ...props }) {
  return <div className={cn(className)} {...props}>{children}</div>
}

/**
 * Card footer component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={cn('border-t border-outline-variant/30 pt-2.5 mt-2.5', className)} {...props}>
      {children}
    </div>
  )
}