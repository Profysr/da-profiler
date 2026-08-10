import { AlertTriangle } from 'lucide-react';

export function N1AlertCard({
  title = "Redundant Query Loop Detected",
  loopLocation = "UserSerializer:14",
  queryCount = 10,
  targetTable = "'roles'",
  traces = [],
  onViewSql,
  onGenerateFix,
  "data-label": testId = "n1-alert-card"
}) {
  return (
    <div className="bg-error-container/10 border border-error/50 rounded-lg p-3 md:p-4 flex flex-col md:flex-row gap-3 items-start" data-label={testId} data-title={title} data-loop-location={loopLocation} data-query-count={queryCount} data-target-table={targetTable}>
      <AlertTriangle className="w-5 h-5 text-error mt-0.5 hidden md:block flex-shrink-0" data-label="alert-icon" />

      <div className="flex flex-col gap-2 w-full">
        {/* Mobile Title */}
        <div className="flex items-center gap-2 md:hidden" data-label="mobile-title">
          <AlertTriangle className="w-4 h-4 text-error flex-shrink-0" data-label="mobile-alert-icon" />
          <h3 className="font-body-md text-sm font-bold text-on-error-container" data-label="mobile-title-text">{title}</h3>
        </div>

        {/* Desktop Title */}
        <h3 className="font-body-md text-sm font-bold text-on-error-container hidden md:block" data-label="desktop-title">{title}</h3>

        <p className="font-code-sm text-xs text-on-surface-variant bg-surface-dim p-2.5 rounded-md border border-outline-variant overflow-x-auto" data-label="alert-description">
          Loop in <span className="text-primary font-code-sm font-semibold" data-label="loop-location">{loopLocation}</span> triggers {queryCount} redundant queries to <span className="text-tertiary font-code-sm font-semibold" data-label="target-table">{targetTable}</span> table.
        </p>

        {traces.length > 0 && (
          <div className="mt-2 flex flex-col gap-1 border-l-2 border-outline-variant pl-3 overflow-x-auto" data-label="trace-container">
            <div className="font-code-sm text-[10px] text-on-surface-variant uppercase tracking-wider" data-label="trace-label">Trace:</div>
            {traces.map((trace, index) => (
              <div
                key={index}
                className={`font-code-sm text-xs text-on-surface whitespace-nowrap ${index === 0 ? 'opacity-90' : 'opacity-60'}`}
                data-label={`trace-item-${index}`}
              >
                {trace}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-error/20 flex flex-wrap gap-4" data-label="alert-actions">
          <button
            onClick={onViewSql}
            className="text-error text-xs font-semibold hover:underline cursor-pointer"
            data-label="view-sql-btn"
          >
            View SQL Fragments
          </button>
          <button
            onClick={onGenerateFix}
            className="text-primary text-xs font-semibold hover:underline cursor-pointer"
            data-label="generate-fix-btn"
          >
            Generate Fix Snippet
          </button>
        </div>
      </div>
    </div>
  );
}