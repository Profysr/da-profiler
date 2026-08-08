// components/ui/Card.jsx
import { cn } from '../../utils/classNames.js'

/**
 * Card component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function Card({ children, className = '', hover = false, padding = 'md', ...props }) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }
  
  return (
    <div
      className={cn(
        'card',
        hover && 'card-hover',
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
    <div className={cn('border-b border-border pb-3 mb-3', className)} {...props}>
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
    <div className={cn('border-t border-border pt-3 mt-3', className)} {...props}>
      {children}
    </div>
  )
}