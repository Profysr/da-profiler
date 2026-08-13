// src/components/ResponseWorkbench.jsx
import { PaneTabs } from './PaneTabs.jsx'
import { ResponseMetrics } from './ResponseMetrics.jsx'
import { JsonViewer } from './JsonViewer.jsx'
import { SqlViewer } from './SqlViewer.jsx'
import { Loader2, TriangleAlert, CheckCircle, Lightbulb } from 'lucide-react'
import { useUiStore } from '../store/uiStore.js'

// ─── Default Empty State Data ──────────────────────────────────────────────
const EMPTY_RESPONSE = {
  status: 'info',
  message: 'No profile run executed yet. Select a target and click Send to inspect results.',
}

// ─── Sub-Component: Error View ─────────────────────────────────────────────
function ResponseErrorView({ error, statusCode }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-3">
      <div className="p-3 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
        <TriangleAlert size={28} />
      </div>
      <div className="space-y-1 max-w-md">
        <h3 className="text-sm font-semibold text-red-400">
          Execution Error {statusCode ? `(${statusCode})` : ''}
        </h3>
        <p className="text-xs text-on-surface-variant font-mono bg-surface-container p-3 rounded border border-outline-variant break-all text-left whitespace-pre-wrap">
          {typeof error === 'string' ? error : JSON.stringify(error, null, 2)}
        </p>
      </div>
    </div>
  )
}

// ─── Sub-Component: Response Headers View ──────────────────────────────────
function ResponseHeadersView({ headers = {} }) {
  const headerEntries = Object.entries(headers)

  if (headerEntries.length === 0) {
    return (
      <div className="text-center py-8 text-xs text-on-surface-variant">
        No response headers returned.
      </div>
    )
  }

  return (
    <div className="border border-outline-variant rounded overflow-hidden">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-surface-container-low border-b border-outline-variant font-label-caps text-[10px] text-on-surface-variant">
            <th className="p-2.5 border-r border-outline-variant w-1/3">Header</th>
            <th className="p-2.5">Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/40">
          {headerEntries.map(([key, value], i) => (
            <tr key={i} className="hover:bg-surface-container/50 transition-colors">
              <td className="p-2.5 font-semibold text-primary border-r border-outline-variant font-mono text-[11px]">
                {key}
              </td>
              <td className="p-2.5 text-on-surface-variant font-mono text-[11px]">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Sub-Component: SQL Queries View ────────────────────────────────────────
function ResponseQueriesView({ queries = [], nPlusOneDetected = false }) {
  return (
    <div className="space-y-3">
      {nPlusOneDetected && (
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
          <TriangleAlert size={14} />
          <span>N+1 Query Issue Detected across database execution</span>
        </div>
      )}

      {queries.length === 0 ? (
        <div className="text-center py-8 text-xs text-on-surface-variant">
          No SQL queries recorded for this execution.
        </div>
      ) : (
        <div className="space-y-3">
          {queries.map((q, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg border border-outline-variant bg-surface space-y-2"
            >
              <div className="flex justify-between items-center text-[10px] text-on-surface-variant">
                <span className="font-bold font-mono text-primary">QUERY #{idx + 1}</span>
                <div className="flex items-center gap-2">
                  {q.src_loc && <span className="font-mono text-zinc-400">{q.src_loc}</span>}
                  {q.time_ms !== undefined && (
                    <span className="text-emerald-400 font-mono font-bold">{q.time_ms} ms</span>
                  )}
                </div>
              </div>
              <SqlViewer sql={q.sql || q.fingerprint || ''} maxHeight="200px" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Sub-Component: Summary View ────────────────────────────────────────────
function ResponseSummaryView({ metrics = {}, analysis = [] }) {
  const totalQueries = metrics.total_queries ?? 0
  const uniqueFingerprints = metrics.unique_fingerprints ?? 0
  const dbTime = metrics.db_time_ms !== undefined ? `${metrics.db_time_ms} ms` : '—'
  const duplicateQueries = totalQueries - uniqueFingerprints

  return (
    <div className="space-y-4">
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg border border-outline-variant bg-surface">
          <span className="text-[10px] font-label-caps uppercase text-on-surface-variant tracking-wider">
            Total Queries
          </span>
          <p className="text-xl font-bold mt-1 text-primary">{totalQueries}</p>
        </div>
        <div className="p-3 rounded-lg border border-outline-variant bg-surface">
          <span className="text-[10px] font-label-caps uppercase text-on-surface-variant tracking-wider">
            Duplicate Queries
          </span>
          <p className={`text-xl font-bold mt-1 ${duplicateQueries > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {duplicateQueries > 0 ? `${duplicateQueries} (N+1)` : '0'}
          </p>
        </div>
        <div className="p-3 rounded-lg border border-outline-variant bg-surface">
          <span className="text-[10px] font-label-caps uppercase text-on-surface-variant tracking-wider">
            DB Execution Time
          </span>
          <p className="text-xl font-bold mt-1 text-emerald-400">{dbTime}</p>
        </div>
      </div>

      {/* Dynamic Analysis & Suggestions */}
      {analysis.length > 0 ? (
        <div className="space-y-3">
          <p className="font-semibold text-xs text-on-surface flex items-center gap-1.5">
            <Lightbulb size={14} className="text-amber-400" /> Performance Analysis & Suggestions
          </p>
          <div className="space-y-2">
            {analysis.map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-outline-variant bg-surface space-y-1 text-xs">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-amber-400">{item.target_model || 'Target Query'}</span>
                  <span className="text-on-surface-variant">Executions: {item.count}</span>
                </div>
                {item.src_loc && <p className="text-[10px] font-mono text-zinc-400">Location: {item.src_loc}</p>}
                {item.suggestion && (
                  <p className="text-on-surface pt-1">
                    <span className="text-primary font-semibold">Suggestion: </span>
                    <code className="font-mono text-xs text-emerald-300 bg-surface-container px-1 py-0.5 rounded border border-outline-variant/50">
                      {item.suggestion}
                    </code>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-lg border border-outline-variant bg-surface text-xs text-on-surface-variant">
          No performance issues detected for this query run.
        </div>
      )}
    </div>
  )
}

// ─── Sub-Component: Side Effects View ───────────────────────────────────────
function ResponseSideEffectsView({ sideEffects = [] }) {
  if (sideEffects.length === 0) {
    return (
      <div className="space-y-3 text-xs">
        <p className="font-semibold text-on-surface">Database Mutations / Side Effects</p>
        <div className="p-3 border border-outline-variant rounded-lg bg-surface text-on-surface-variant">
          No side effect warnings recorded during this execution.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 text-xs">
      <p className="font-semibold text-on-surface">Database Mutations / Side Effects</p>
      <div className="divide-y divide-outline-variant/30 border border-outline-variant rounded-lg overflow-hidden">
        {sideEffects.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2.5 px-3 py-2.5 bg-surface hover:bg-surface-container/40 transition-colors">
            {item.type === 'warning' ? (
              <TriangleAlert size={14} className="text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle size={14} className="text-emerald-400 shrink-0 mt-0.5" />
            )}
            <span className="text-on-surface-variant">{typeof item === 'string' ? item : item.message || JSON.stringify(item)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component: ResponseWorkbench ───────────────────────────────────────
export function ResponseWorkbench({
  profileResult,
  loading = false,
  metrics,
  'data-label': testId = 'response-workbench',
}) {
  const { activeResponseTab, setActiveResponseTab } = useUiStore()

  // Parse result dynamic data according to profiler output schema
  const queries = profileResult?.queries || []
  const responseData = profileResult?.response_body ?? (profileResult?.error ? null : EMPTY_RESPONSE)
  const headers = profileResult?.request?.headers || profileResult?.headers || {}
  const analysis = profileResult?.analysis || profileResult?.metrics?.n_plus_one_groups || []
  const sideEffects = profileResult?.side_effect_warnings || []

  // Dynamic tab items with real counts
  const responseTabs = [
    { id: 'response', label: 'Response' },
    { id: 'headers', label: 'Headers', count: Object.keys(headers).length },
    { id: 'queries', label: 'SQL Queries', count: queries.length },
    { id: 'summary', label: 'Summary' },
    { id: 'sideEffects', label: 'Side Effects', count: sideEffects.length },
  ]

  return (
    <section className="flex-1 flex flex-col bg-background overflow-hidden relative" data-label={testId}>
      {/* Metrics Header Strip */}
      <ResponseMetrics
        status={metrics?.status || '—'}
        time={metrics?.time || '—'}
        size={metrics?.size || '—'}
        testId={`${testId}-metrics`}
      />

      {/* Tab Navigation */}
      <PaneTabs
        tabs={responseTabs}
        activeId={activeResponseTab}
        onChange={setActiveResponseTab}
        testId={`${testId}-tabs`}
      />

      {/* Main Content Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-surface-container-lowest text-on-surface relative" data-label={`${testId}-content`}>
        {loading ? (
          <div className="flex items-center justify-center h-full gap-2 text-on-surface-variant">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-xs">Executing target & profiling execution...</span>
          </div>
        ) : profileResult?.error ? (
          <ResponseErrorView error={profileResult.error} statusCode={profileResult.status_code} />
        ) : (
          <>
            {activeResponseTab === 'response' && (
              <JsonViewer data={responseData} className="h-full min-h-[250px]" />
            )}

            {activeResponseTab === 'headers' && (
              <ResponseHeadersView headers={headers} />
            )}

            {activeResponseTab === 'queries' && (
              <ResponseQueriesView
                queries={queries}
                nPlusOneDetected={profileResult?.metrics?.n_plus_one_detected}
              />
            )}

            {activeResponseTab === 'summary' && (
              <ResponseSummaryView
                metrics={profileResult?.metrics || {}}
                analysis={analysis}
              />
            )}

            {activeResponseTab === 'sideEffects' && (
              <ResponseSideEffectsView sideEffects={sideEffects} />
            )}
          </>
        )}
      </div>
    </section>
  )
}