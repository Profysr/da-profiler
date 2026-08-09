// components/profiler/N1AnalysisTab.jsx
import { useState } from 'react'
import { cn } from '../../utils/classNames.js'
import { Card } from '../ui/Card.jsx'
import { CopyButton } from '../ui/CopyButton.jsx'
import { SqlViewer } from '../ui/SqlViewer.jsx'
import { Button } from '../ui/Button.jsx'

/**
 * N+1 Analysis card component matching design
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
      <div className="bg-error-container/10 border-b border-error/50 p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-error font-mono text-sm px-2 py-0.5 bg-error-container/50 rounded rounded-sm">
            {analysis.fingerprint}
          </span>
          <span className="text-error font-bold px-2 py-0.5 bg-error-container/50 rounded rounded-sm text-sm">
            ×{analysis.count}
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded hover:bg-surface-variant text-on-surface-variant hover:text-on-surface transition-colors"
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          <span className={cn('material-symbols-outlined text-[18px] transition-transform', expanded && 'rotate-180')} aria-hidden="true">expand_more</span>
        </button>
      </div>

      <div className={cn('overflow-hidden transition-all duration-200', expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0')}>
        <div className="p-4 md:p-md space-y-4">
          {analysis.source_location && (
            <div className="font-code-sm text-code-sm text-on-surface-variant bg-surface-dim p-2 rounded border border-outline-variant">
              {analysis.source_location}
            </div>
          )}

          <div className="bg-primary/5 border border-primary/30 rounded p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-primary font-bold font-body-sm">💡 Suggested Fix</span>
              <CopyButton text={analysis.suggestion || ''} className="absolute top-3 right-3" />
            </div>
            <pre className="font-code-sm text-code-sm text-on-surface whitespace-pre-wrap bg-surface-dim p-3 rounded border border-outline-variant overflow-x-auto">
              {analysis.suggestion || 'Review queryset relationships.'}
            </pre>
          </div>

          {analysis.sample_queries && analysis.sample_queries.length > 1 && (
            <details className="group">
              <summary className="cursor-pointer text-primary font-body-sm hover:underline flex items-center gap-2">
                <span className={cn('material-symbols-outlined text-[16px] transition-transform', expanded && 'rotate-180')} aria-hidden="true">expand_more</span>
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
 * N+1 Analysis tab component matching design
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function N1AnalysisTab({ result }) {
  const analysis = result?.analysis || []

  if (!result || analysis.length === 0) {
    return (
      <div className="p-4 md:p-md bg-surface-container border border-outline-variant rounded flex flex-col justify-center gap-2">
        <span className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">check_circle</span> N+1 Status
        </span>
        <div className="font-headline-md text-headline-md text-[#a5d6a7]">Clean</div>
        <div className="w-full bg-surface rounded-full h-1 mt-1">
          <div className="bg-accent-green h-1 rounded-full w-full" />
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
          No N+1 issues detected. All query patterns look healthy for this endpoint.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-md bg-surface flex-1 flex flex-col gap-4 md:gap-md overflow-y-auto">
      <div className="bg-error-container/10 border border-error/50 rounded p-3 md:p-4 flex flex-col md:flex-row gap-3 items-start">
        <span className="material-symbols-outlined text-error mt-0.5 hidden md:block">error</span>
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center gap-2 md:hidden">
            <span className="material-symbols-outlined text-error">error</span>
            <h3 className="font-body-md text-body-md font-bold text-on-error-container">Redundant Query Loop Detected</h3>
          </div>
          <h3 className="font-body-md text-body-md font-bold text-on-error-container hidden md:block">Redundant Query Loop Detected</h3>
          <p className="font-code-sm text-code-sm text-on-surface-variant bg-surface-dim p-2 rounded border border-outline-variant overflow-x-auto">
            Loop in <span className="text-primary font-code-sm">UserSerializer:14</span> triggers {analysis[0]?.count || 10} redundant queries to <span className="text-tertiary font-code-sm">'roles'</span> table.
          </p>
          <div className="mt-2 flex flex-col gap-1 border-l-2 border-outline-variant pl-3 overflow-x-auto">
            <div className="font-label-caps text-label-caps text-on-surface-variant">Trace:</div>
            {analysis[0]?.source_location && (
              <div className="font-code-sm text-code-sm text-on-surface opacity-80 whitespace-nowrap">{analysis[0].source_location}</div>
            )}
            {analysis[0]?.sample_queries && analysis[0].sample_queries.map((sq, i) => (
              <div key={i} className="font-code-sm text-code-sm text-on-surface opacity-60 whitespace-nowrap">{sq}</div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-error/20 flex flex-wrap gap-3">
            <Button variant="ghost" className="text-error font-label-caps text-label-caps hover:underline" onClick={() => {}}>
              View SQL Fragments
            </Button>
            <Button variant="secondary" className="text-primary font-label-caps text-label-caps hover:underline" onClick={() => {}}>
              Generate Fix Snippet
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {analysis.slice(1).map((item, index) => (
          <N1Card key={index} analysis={item} index={index} />
        ))}
      </div>
    </div>
  )
}