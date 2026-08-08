// components/profiler/ResponseTab.jsx
import { FileJson, Eye, EyeOff, Copy } from 'lucide-react'
import { useState, useCallback } from 'react'
import { cn } from '../../utils/classNames.js'
import { JsonViewer } from '../ui/JsonViewer.jsx'
import { formatJSON, parseAndFormatJSON } from '../../utils/jsonHighlighter.js'
import { EmptyState } from '../dashboard/EmptyState.jsx'

/**
 * Response tab component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function ResponseTab({ result }) {
  const [viewMode, setViewMode] = useState('formatted') // 'formatted' | 'raw'
  const responseBody = result?.response_body
  
  if (!result || responseBody === null || responseBody === undefined) {
    return (
      <EmptyState
        title="No Response Body"
        description="The endpoint returned no parseable response body."
        icon={() => (
          <FileJson className="h-8 w-8 text-text-secondary" aria-hidden="true" />
        )}
      />
    )
  }
  
  const formattedJson = formatJSON(responseBody)
  const rawJson = typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)
  
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeString(formattedJson)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }, [formattedJson])
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">
            Response Body ({viewMode === 'formatted' ? 'Formatted' : 'Raw'})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'formatted' ? 'raw' : 'formatted')}
            className={cn(
              'px-2 py-1 text-xs rounded border transition-colors',
              viewMode === 'formatted'
                ? 'bg-bg-tertiary text-text-primary border-border'
                : 'bg-bg-secondary text-text-secondary border-border hover:bg-bg-tertiary'
            )}
            aria-label={viewMode === 'formatted' ? 'Show raw JSON' : 'Show formatted JSON'}
          >
            {viewMode === 'formatted' ? 'Raw' : 'Formatted'}
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Copy response"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      
      <div className="relative">
        {viewMode === 'formatted' ? (
          <JsonViewer data={responseBody} maxHeight="500px" copyable={false} />
        ) : (
          <div className="relative">
            <pre className="p-4 bg-bg-secondary border border-border rounded-lg overflow-auto max-h-[500px] font-mono text-sm">
              <code className="whitespace-pre-wrap break-all text-text-primary">
                {rawJson}
              </code>
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}