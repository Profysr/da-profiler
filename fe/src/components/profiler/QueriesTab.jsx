// components/profiler/QueriesTab.jsx
import { useMemo } from 'react'
import { cn } from '../../utils/classNames.js'
import { formatDuration } from '../../utils/formatters.js'
import { Table } from '../ui/Table.jsx'
import { SqlViewer } from '../ui/SqlViewer.jsx'
import { EmptyState } from '../dashboard/EmptyState.jsx'

/**
 * Queries tab component with virtualized table
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
  
  const columns = useMemo(() => [
    {
      key: 'seq',
      header: '#',
      className: 'w-12 text-text-secondary font-mono',
      render: (_, index) => index + 1,
    },
    {
      key: 'sql',
      header: 'SQL',
      className: 'font-mono text-sm',
      render: (row) => (
        <div className="max-h-32 overflow-auto">
          <SqlViewer sql={row.sql} maxHeight="200px" showLineNumbers={false} copyable={false} />
        </div>
      ),
    },
    {
      key: 'time_ms',
      header: 'Time (ms)',
      className: 'w-28 font-mono text-right',
      render: (row) => {
        const time = row.duration_ms || row.time_ms || 0
        const timeClass = time > 200 ? 'text-accent-red' : time > 50 ? 'text-accent-orange' : ''
        return <span className={cn('font-bold', timeClass)}>{formatDuration(time)}</span>
      },
    },
    {
      key: 'source',
      header: 'Source',
      className: 'w-48 font-mono text-xs text-text-secondary truncate',
      render: (row) => row.source_location || '—',
    },
  ], [])
  
  const data = useMemo(() => queries.map((q, i) => ({
    seq: i + 1,
    sql: q.sql,
    time_ms: q.duration_ms || q.time_ms || 0,
    source: q.source_location || '—',
  })), [queries])
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-text-secondary">
        <span>{queries.length} query{queries.length !== 1 ? 's' : ''} executed</span>
        <span className="font-mono">
          Total: {formatDuration(queries.reduce((sum, q) => sum + (q.duration_ms || q.time_ms || 0), 0))}
        </span>
      </div>
      
      <Table
        columns={columns}
        data={data}
        keyField="seq"
        striped
        hover
      />
    </div>
  )
}