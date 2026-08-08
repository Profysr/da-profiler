// components/ui/CopyButton.jsx
import { useState, useCallback } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '../../utils/classNames.js'

/**
 * Copy button component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function CopyButton({ text, className = '', tooltip = 'Copy to clipboard', ...props }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }, [text])
  
  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'p-1.5 rounded transition-colors duration-fast',
        'hover:bg-bg-tertiary',
        'text-text-secondary hover:text-text-primary',
        copied && 'text-accent-green',
        className
      )}
      aria-label={copied ? 'Copied!' : tooltip}
      {...props}
    >
      {copied ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  )
}