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
        'p-1.5 rounded transition-all text-xs font-medium border border-outline-variant',
        'bg-surface-container-high hover:bg-surface-container-highest',
        'text-on-surface-variant hover:text-on-surface',
        copied && 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
        className
      )}
      title={copied ? 'Copied to clipboard!' : tooltip}
      aria-label={copied ? 'Copied!' : tooltip}
      {...props}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      )}
    </button>
  )
}