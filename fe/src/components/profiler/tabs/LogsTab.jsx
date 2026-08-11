// components/profiler/LogsTab.jsx
import { CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react';
import { EmptyState } from '../../dashboard/EmptyState.jsx';
import { cn } from '../../../utils/classNames.js';

/**
 * LogsTab — renders the process_log from ExecutionResult as a structured step timeline.
 * Each entry corresponds to a named pipeline step (e.g. baseline_seeding, sandbox_execution)
 * with its timing, status, and any error message.
 */
export function LogsTab({ result, "data-label": testId = "logs-tab" }) {
  const logs = result?.process_log || [];
  const summary = result?.process_log_summary || '';

  if (!result || (logs.length === 0 && !summary)) {
    return (
      <EmptyState
        title="No Execution Logs"
        description="Run the profiler to see step-by-step execution logs here."
        icon={
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        }
        data-label={`${testId}-empty-state`}
      />
    );
  }

  // If structured log exists, render it as a timeline
  if (logs.length > 0) {
    // Deduplicate: keep only the last entry per step (start gets overwritten by success/error)
    const stepMap = new Map();
    logs.forEach(entry => {
      stepMap.set(entry.step, entry);
    });
    const deduped = Array.from(stepMap.values());

    return (
      <div className="flex flex-col gap-0" data-label={testId} data-log-count={logs.length}>
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-outline-variant flex items-center justify-between" data-label={`${testId}-header`}>
          <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
            Execution Pipeline — {deduped.length} steps
          </span>
          <span className="text-[11px] text-on-surface-variant font-mono">
            {deduped.filter(s => s.success).length}/{deduped.length} ok
          </span>
        </div>

        {/* Step rows */}
        <div className="flex flex-col divide-y divide-outline-variant/30" data-label={`${testId}-steps`}>
          {deduped.map((entry, i) => {
            const isSuccess = entry.success !== false;
            const hasDuration = entry.duration_ms != null;
            const hasMetadata = entry.metadata && Object.keys(entry.metadata).length > 0;

            return (
              <div
                key={`${entry.step}-${i}`}
                className={cn(
                  'px-4 py-3 flex flex-col gap-1 group transition-colors',
                  isSuccess ? 'hover:bg-surface-variant/20' : 'bg-error-container/5 hover:bg-error-container/10'
                )}
                data-label={`${testId}-step-${entry.step}`}
                data-step={entry.step}
                data-success={isSuccess}
              >
                {/* Row 1: icon + step name + message + duration */}
                <div className="flex items-start gap-3">
                  {/* Status icon */}
                  <div className="shrink-0 mt-0.5">
                    {isSuccess ? (
                      <CheckCircle className="w-4 h-4 text-[#4caf50]" />
                    ) : (
                      <XCircle className="w-4 h-4 text-error" />
                    )}
                  </div>

                  {/* Step name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          'text-[11px] font-mono font-bold uppercase tracking-wider',
                          isSuccess ? 'text-primary' : 'text-error'
                        )}
                        data-label={`${testId}-step-name-${i}`}
                      >
                        {entry.step}
                      </span>

                      {hasDuration && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-mono text-on-surface-variant bg-surface-variant/60 px-1.5 py-0.5 rounded"
                          data-label={`${testId}-step-duration-${i}`}
                        >
                          <Clock className="w-3 h-3" />
                          {entry.duration_ms.toFixed(1)}ms
                        </span>
                      )}
                    </div>

                    {/* Message */}
                    <p
                      className="text-[12px] text-on-surface mt-0.5 leading-snug"
                      data-label={`${testId}-step-message-${i}`}
                    >
                      {/* Strip "OK: " / "START: " / "FAILED: " prefixes for cleaner display */}
                      {entry.message.replace(/^(OK|START|FAILED):\s*/i, '')}
                    </p>

                    {/* Error detail */}
                    {entry.error && (
                      <p
                        className="text-[11px] text-error mt-1 font-mono bg-error-container/10 px-2 py-1 rounded"
                        data-label={`${testId}-step-error-${i}`}
                      >
                        {entry.error}
                      </p>
                    )}

                    {/* Metadata key-value pills */}
                    {hasMetadata && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5" data-label={`${testId}-step-meta-${i}`}>
                        {Object.entries(entry.metadata).map(([k, v]) => {
                          const display = typeof v === 'object' ? JSON.stringify(v) : String(v);
                          if (display.length > 80) return null; // skip huge values
                          return (
                            <span
                              key={k}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-variant/50 text-on-surface-variant"
                              title={`${k}: ${display}`}
                            >
                              <span className="text-on-surface-variant/60">{k}=</span>{display}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary footer */}
        {summary && (
          <div className="px-4 py-3 border-t border-outline-variant bg-surface-container-low" data-label={`${testId}-summary`}>
            <p className="text-[11px] font-mono text-on-surface-variant whitespace-pre-wrap leading-relaxed">{summary}</p>
          </div>
        )}
      </div>
    );
  }

  // Fallback: plain text summary only
  return (
    <div className="p-4 font-mono text-[12px] text-on-surface-variant whitespace-pre-wrap leading-relaxed" data-label={testId}>
      {summary}
    </div>
  );
}
