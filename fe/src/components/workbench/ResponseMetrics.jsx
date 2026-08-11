// components/workbench/ResponseMetrics.jsx
import { CheckCircle } from 'lucide-react'

function MetricDivider() {
  return <div className="w-px h-4 bg-outline-variant" aria-hidden="true" />
}

function MetricLabel({ children }) {
  return (
    <span className="font-label-caps text-label-caps text-outline-variant">{children}</span>
  )
}

function StatusMetric({ code = 201, label = 'Created' }) {
  return (
    <div className="flex items-center gap-2" data-label="response-metric-status">
      <MetricLabel>STATUS</MetricLabel>
      <span className="font-code-md text-code-md text-tertiary font-bold flex items-center gap-1">
        <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
        {code} {label}
      </span>
    </div>
  )
}

function ValueMetric({ label, value }) {
  return (
    <div className="flex items-center gap-2" data-label={`response-metric-${label.toLowerCase()}`}>
      <MetricLabel>{label}</MetricLabel>
      <span className="font-code-md text-code-md text-on-surface">{value}</span>
    </div>
  )
}

function QueriesWarningMetric({ queries = 12, duplicates = 4 }) {
  return (
    <div
      className="flex items-center gap-2 bg-error-container/20 px-2 py-1 rounded border border-error/30"
      data-label="response-metric-queries-warning"
    >
      <span className="material-symbols-outlined text-[14px] text-error" aria-hidden="true">
        warning
      </span>
      <span className="font-code-sm text-code-sm text-error">
        {queries} Queries / {duplicates} Duplicates
      </span>
    </div>
  )
}

export function ResponseMetrics({
  status = { code: 201, label: 'Created' },
  time = '38.4 ms',
  size = '1.2 KB',
  queries = { count: 12, duplicates: 4 },
  "data-label": testId = 'response-metrics',
}) {
  return (
    <div
      className="bg-surface-container-low border-b border-outline-variant p-2 flex items-center gap-4 shrink-0 overflow-x-auto whitespace-nowrap"
      data-label={testId}
    >
      <StatusMetric code={status.code} label={status.label} />
      <MetricDivider />

      <ValueMetric label="TIME" value={time} />
      <MetricDivider />

      <ValueMetric label="SIZE" value={size} />
      <MetricDivider />

      <QueriesWarningMetric queries={queries.count} duplicates={queries.duplicates} />
    </div>
  )
}
