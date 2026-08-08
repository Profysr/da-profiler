// components/profiler/N1AnalysisTab.jsx
import { useState } from 'react'
import { ChevronDown, Copy, AlertCircle, CheckCircle, FileCode } from 'lucide-react'
import { cn } from '../../utils/classNames.js'
import { Card } from '../ui/Card.jsx'
import { CopyButton } from '../ui/CopyButton.jsx'
import { SqlViewer } from '../ui/SqlViewer.jsx'

/**
 * N+1 Analysis card component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
function N1Card({ analysis, index }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const handleCopy = () => {
    navigator.clipboard.writeText(analysis.suggestion || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <Card className="overflow-hidden" padding="none">
      <div className="bg-accent-red/10 border-b border-accent-red/20 p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-accent-red font-mono text-sm px-2 py-0.5 bg-accent-red/20 rounded">
            {analysis.fingerprint}
          </span>
          <span className="text-accent-red font-bold px-2 py-0.5 bg-accent-red/20 rounded text-sm">
            ×{analysis.count}
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} aria-hidden="true" />
        </button>
      </div>
      
      <div className={cn('overflow-hidden transition-all duration-200', expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0')}>
        <div className="p-4 space-y-4">
          {analysis.source_location && (
            <div className="text-text-secondary font-mono text-xs bg-bg-tertiary p-2 rounded">
              {analysis.source_location}
            </div>
          )}
          
          <div className="bg-accent-green/10 border border-accent-green/20 rounded p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-accent-green font-bold text-sm">💡 Suggested Fix</span>
              <CopyButton text={analysis.suggestion || ''} className="absolute top-3 right-3" />
            </div>
            <pre className="font-mono text-sm text-text-primary whitespace-pre-wrap">
              {analysis.suggestion || 'Review queryset relationships.'}
            </pre>
          </div>
          
          {analysis.sample_queries && analysis.sample_queries.length > 1 && (
            <details className="group">
              <summary className="cursor-pointer text-accent-blue text-sm font-medium hover:underline flex items-center gap-2">
                <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} aria-hidden="true" />
                {analysis.sample_queries.length} captured sample queries
              </summary>
              <div className="mt-3 space-y-2">
                {analysis.sample_queries.map((sq, i) => (
                  <SqlViewer key={i} sql={sq} maxHeight="150px" showLineNumbers={false} />
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </Card>
  )
}

/**
 * N+1 Analysis tab component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function N1AnalysisTab({ result }) {
  const analysis = result?.analysis || []
  
  if (!result || analysis.length === 0) {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-accent-green/10 border border-accent-green/20 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-6 w-6 text-accent-green" aria-hidden="true" />
            <h3 className="text-lg font-medium text-text-primary">No N+1 Issues Found</h3>
          </div>
          <p className="text-text-secondary">
            All query patterns look healthy for this endpoint. No N+1 bottlenecks detected.
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="p-4 bg-accent-red/10 border border-accent-red/20 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="h-6 w-6 text-accent-red" aria-hidden="true" />
          <div>
            <h3 className="text-lg font-medium text-text-primary">
              N+1 Query Bottleneck{analysis.length > 1 ? 's' : ''} Detected
            </h3>
            <p className="text-text-secondary text-sm">
              {analysis.length} issue{analysis.length > 1 ? 's' : ''} found. Apply the suggestions below to fix your queryset.
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {analysis.map((item, index) => (
          <N1Card key={index} analysis={item} index={index} />
        ))}
      </div>
    </div>
  )
}