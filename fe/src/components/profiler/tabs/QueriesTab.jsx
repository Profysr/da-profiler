import { cn } from '../../../utils/classNames.js';
import { SqlHighlighter } from '../../ui/SqlHighlighter.jsx';
import { EmptyState } from '../../dashboard/EmptyState.jsx';

export function QueriesTab({ result, "data-label": testId = "queries-tab" }) {
  const queries = result?.queries || [];

  if (!result || queries.length === 0) {
    return (
      <EmptyState
        title="No Queries Captured"
        description="No database queries were executed during this run."
        icon={
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
        }
        data-label={`${testId}-empty-state`}
      />
    );
  }

  return (
    <div className="overflow-x-auto w-full" data-label={testId} data-query-count={queries.length}>
      <table className="w-full text-left border-collapse min-w-[600px]" data-label={`${testId}-table`}>
        <thead>
          <tr className="bg-surface-variant/50 border-b border-outline-variant" data-label={`${testId}-thead`}>
            <th className="px-4 py-3 font-label-caps text-label-caps text-on-surface-variant w-12" data-label={`${testId}-th-num`}>#</th>
            <th className="px-4 py-3 font-label-caps text-label-caps text-on-surface-variant w-24" data-label={`${testId}-th-time`}>Time (ms)</th>
            <th className="px-4 py-3 font-label-caps text-label-caps text-on-surface-variant w-20" data-label={`${testId}-th-rows`}>Rows</th>
            <th className="px-4 py-3 font-label-caps text-label-caps text-on-surface-variant" data-label={`${testId}-th-statement`}>Statement</th>
          </tr>
        </thead>
        <tbody className="font-code-sm text-code-sm" data-label={`${testId}-tbody`}>
          {queries.map((q, index) => {
            const time = q.duration_ms || q.time_ms || 0;
            const isNPlusOne = q.is_n_plus_one || q.tag === 'N+1 Origin';
            const timeClass = time > 10 ? 'text-error' : 'text-on-surface';
            const rowClass = cn(
              'border-b border-outline-variant/30 hover:bg-surface-variant/20 transition-colors',
              isNPlusOne && 'bg-error-container/5'
            );

            return (
              <tr key={q.id || index} className={rowClass} data-label={`${testId}-row-${index}`} data-query-id={q.id || index} data-is-n-plus-one={isNPlusOne} data-time={time} data-rows={q.rows_returned || q.rows || 1}>
                <td className="px-4 py-3 text-on-surface-variant" data-label={`${testId}-cell-num-${index}`}>{index + 1}</td>
                <td className={cn('px-4 py-3 font-bold', timeClass)} data-label={`${testId}-cell-time-${index}`}>{time}ms</td>
                <td className="px-4 py-3 text-on-surface" data-label={`${testId}-cell-rows-${index}`}>{q.rows_returned || q.rows || 1}</td>
                <td className="px-4 py-3 flex items-center justify-between gap-2" data-label={`${testId}-cell-statement-${index}`}>
                  <SqlHighlighter
                    sql={q.sql}
                    dialect={q.dialect || 'postgres'}
                    theme="dark"
                    maxHeight="120px"
                    className="w-full bg-transparent"
                    data-label={`${testId}-sql-highlighter-${index}`}
                  />
                  {isNPlusOne && (
                    <span className="text-secondary opacity-60 text-xs whitespace-nowrap" data-label={`${testId}-n1-badge-${index}`}>
                      -- N+1 Origin
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}