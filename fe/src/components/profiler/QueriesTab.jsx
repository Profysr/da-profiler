// components/profiler/QueriesTab.jsx
import { useMemo } from 'react'
import { cn } from '../../utils/classNames.js'
import { formatDuration } from '../../utils/formatters.js'
import { SqlViewer } from '../ui/SqlViewer.jsx'
import { EmptyState } from '../dashboard/EmptyState.jsx'

/**
 * Queries tab component with SQL table matching design
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function QueriesTab({ result }) {
  const queries = result?.sql_queries || []

  if (!result || queries.length === 0) {
    return (
      <EmptyState
        title="No Queries Captured"
        description="No database queries were executed during this run."
        icon={() => (
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
        )}
      />
    )
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="bg-surface-variant/50 border-b border-outline-variant">
            <th className="px-4 py-3 font-label-caps text-label-caps text-on-surface-variant w-12">#</th>
            <th className="px-4 py-3 font-label-caps text-label-caps text-on-surface-variant w-24">Time (ms)</th>
            <th className="px-4 py-3 font-label-caps text-label-caps text-on-surface-variant w-20">Rows</th>
            <th className="px-4 py-3 font-label-caps text-label-caps text-on-surface-variant">Statement</th>
          </tr>
        </thead>
        <tbody className="font-code-sm text-code-sm">
          {queries.map((q, index) => {
            const time = q.duration_ms || q.time_ms || 0
            const isNPlusOne = q.is_n_plus_one || false
            const timeClass = time > 200 ? 'text-error' : time > 50 ? 'text-tertiary' : ''
            const rowClass = cn(
              'border-b border-outline-variant/30 hover:bg-surface-variant/20 transition-colors',
              isNPlusOne && 'bg-error-container/5'
            )

            return (
              <tr key={index} className={rowClass}>
                <td className="px-4 py-3 text-on-surface-variant">{index + 1}</td>
                <td className={cn('px-4 py-3 font-bold', timeClass)}>{formatDuration(time)}</td>
                <td className="px-4 py-3 text-on-surface">{q.rows_returned || q.rows || 1}</td>
                <td className="px-4 py-3">
                  <div className="max-h-32 overflow-auto">
                    <SqlViewer sql={q.sql} maxHeight="200px" showLineNumbers={false} copyable={false} />
                  </div>
                  {isNPlusOne && (
                    <span className="text-secondary opacity-60 text-[10px] block mt-1">-- N+1 Origin</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}