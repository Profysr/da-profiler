// components/ui/Button.jsx
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/classNames.js'

/**
 * Button component with variants
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    success: 'btn-success',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        "btn cursor-pointer",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      )}
      {!loading && children}
    </button>
  );
}