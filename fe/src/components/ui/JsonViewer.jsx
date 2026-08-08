// components/ui/JsonViewer.jsx
import { useState, useMemo } from 'react'
import { cn } from '../../utils/classNames.js'
import { highlightJSON, formatJSON } from '../../utils/jsonHighlighter.js'
import { CopyButton } from './CopyButton.jsx'

/**
 * JSON Viewer component with syntax highlighting
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function JsonViewer({ data, className = '', maxHeight = '400px', copyable = true }) {
  const [expanded, setExpanded] = useState({})
  
  const jsonString = useMemo(() => formatJSON(data), [data])
  const highlighted = useMemo(() => highlightJSON(jsonString), [jsonString])
  
  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString)
  }
  
  return (
    <div className={cn('relative font-mono text-sm', className)}>
      {copyable && (
        <div className="absolute top-2 right-2 z-10">
          <CopyButton text={jsonString} />
        </div>
      )}
      <pre className={cn('p-4 bg-bg-secondary border border-border rounded-lg overflow-auto', 'max-h-[${maxHeight}]')} style={{ maxHeight }}>
        <code className="whitespace-pre-wrap break-all">
          {highlighted.map((token) => (
            <span key={token.key} className={token.className}>
              {token.children}
            </span>
          ))}
        </code>
      </pre>
    </div>
  )
}