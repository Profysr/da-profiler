// src/components/ResponseWorkbench.jsx
import { PaneTabs } from './workbench/PaneTabs.jsx'
import { ResponseMetrics } from './workbench/ResponseMetrics.jsx'
import { PROFILER_TABS } from '../utils/constants.js'
import { CopyButton } from './ui/CopyButton.jsx'

export function ResponseWorkbench({
  activeTabId = 'response',
  onTabChange,
  metrics,
  profileResult,
  loading = false,
  "data-label": testId = 'response-workbench',
}) {
  // Postman & Profiler Merged Tabs: Response, Headers, SQL Queries, Summary, Side Effects, Logs
  const responseTabs = [
    { id: 'response', label: 'Response' },
    { id: 'headers', label: 'Headers' },
    { id: 'queries', label: 'SQL Queries', count: profileResult?.sql_queries?.length || profileResult?.queries?.length || 0 },
    { id: 'summary', label: 'Summary' },
    { id: 'sideEffects', label: 'Side Effects Analysis' },
    { id: 'logs', label: 'Logs' },
  ]

  const mockResponseJson = profileResult?.response?.data || profileResult?.data || {
    status: "success",
    message: "Fetched 4 books from database",
    count: 4,
    results: [
      { id: 1, title: "The Great Gatsby", author: { id: 1, name: "F. Scott Fitzgerald" } },
      { id: 2, title: "Tender Is the Night", author: { id: 1, name: "F. Scott Fitzgerald" } },
      { id: 3, title: "To Kill a Mockingbird", author: { id: 2, name: "Harper Lee" } },
      { id: 4, title: "Go Set a Watchman", author: { id: 2, name: "Harper Lee" } }
    ]
  }

  const responseJsonString = JSON.stringify(mockResponseJson, null, 2)

  return (
    <section
      className="flex-1 flex flex-col bg-background overflow-hidden relative select-none"
      data-label={testId}
    >
      {/* Response Metrics Strip */}
      <ResponseMetrics {...metrics} testId={`${testId}-metrics`} />

      <PaneTabs
        tabs={responseTabs}
        activeId={activeTabId}
        onChange={onTabChange}
        testId={`${testId}-tabs`}
      />

      <div
        className="flex-1 p-4 overflow-y-auto bg-surface-container-lowest font-mono text-xs text-on-surface relative"
        data-label={`${testId}-content`}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
            <span>Executing target & profiling execution...</span>
          </div>
        ) : (
          <>
            {/* 1. Response Tab */}
            {activeTabId === 'response' && (
              <div className="relative group">
                <div className="absolute right-2 top-2 z-10">
                  <CopyButton text={responseJsonString} />
                </div>
                <pre className="p-3 rounded bg-surface border border-outline-variant text-emerald-400 overflow-x-auto font-mono text-xs">
                  {responseJsonString}
                </pre>
              </div>
            )}

            {/* 2. Headers Tab */}
            {activeTabId === 'headers' && (
              <div className="space-y-2">
                <div className="border border-outline-variant rounded overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline-variant font-label-caps text-[10px] text-on-surface-variant">
                        <th className="p-2 border-r border-outline-variant">Header</th>
                        <th className="p-2">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/40">
                      {[
                        { key: 'Content-Type', value: 'application/json' },
                        { key: 'Vary', value: 'Accept, Cookie' },
                        { key: 'Allow', value: 'GET, POST, HEAD, OPTIONS' },
                        { key: 'X-Frame-Options', value: 'DENY' },
                        { key: 'X-Content-Type-Options', value: 'nosniff font-mono' },
                      ].map((h, i) => (
                        <tr key={i} className="hover:bg-surface-container-high/30">
                          <td className="p-2 font-semibold text-primary border-r border-outline-variant">{h.key}</td>
                          <td className="p-2 text-on-surface-variant font-mono">{h.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. SQL Queries Tab */}
            {activeTabId === 'queries' && (
              <div className="space-y-3">
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  <span>Detected N+1 Query: Author fetched 4 times in loop</span>
                </div>
                <div className="space-y-2">
                  {[
                    { sql: 'SELECT "myapp_book"."id", "myapp_book"."title" FROM "myapp_book"', time: '0.4ms' },
                    { sql: 'SELECT "myapp_author"."id", "myapp_author"."name" FROM "myapp_author" WHERE "myapp_author"."id" = 1', time: '0.8ms', n1: true },
                    { sql: 'SELECT "myapp_author"."id", "myapp_author"."name" FROM "myapp_author" WHERE "myapp_author"."id" = 1', time: '0.8ms', n1: true },
                    { sql: 'SELECT "myapp_author"."id", "myapp_author"."name" FROM "myapp_author" WHERE "myapp_author"."id" = 2', time: '0.8ms', n1: true },
                  ].map((q, idx) => (
                    <div key={idx} className={`p-2.5 rounded border ${q.n1 ? 'border-amber-500/40 bg-amber-500/5' : 'border-outline-variant bg-surface'}`}>
                      <div className="flex justify-between items-center text-[10px] text-on-surface-variant mb-1">
                        <span className="font-bold">QUERY #{idx + 1}</span>
                        <span className="text-primary font-mono">{q.time}</span>
                      </div>
                      <code className="text-xs text-on-surface font-mono">{q.sql}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Summary Tab */}
            {activeTabId === 'summary' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded border border-outline-variant bg-surface">
                    <span className="text-[10px] font-label-caps uppercase text-on-surface-variant">Queries Executed</span>
                    <p className="text-lg font-bold text-primary mt-1">4</p>
                  </div>
                  <div className="p-3 rounded border border-outline-variant bg-surface">
                    <span className="text-[10px] font-label-caps uppercase text-on-surface-variant">Duplicate Queries</span>
                    <p className="text-lg font-bold text-amber-400 mt-1">3 (N+1)</p>
                  </div>
                  <div className="p-3 rounded border border-outline-variant bg-surface">
                    <span className="text-[10px] font-label-caps uppercase text-on-surface-variant">Total Duration</span>
                    <p className="text-lg font-bold text-emerald-400 mt-1">14.2 ms</p>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Side Effects Analysis Tab */}
            {activeTabId === 'sideEffects' && (
              <div className="space-y-2 text-xs text-on-surface-variant">
                <p className="font-semibold text-on-surface">Database Mutations / Side Effects:</p>
                <ul className="list-disc pl-4 space-y-1 text-on-surface-variant">
                  <li>No database writes (INSERT/UPDATE/DELETE) detected.</li>
                  <li>No Celery tasks spawned during request cycle.</li>
                  <li>Signal listeners triggered: <code className="text-primary">post_init</code> (x4).</li>
                </ul>
              </div>
            )}

            {/* 6. Logs Tab */}
            {activeTabId === 'logs' && (
              <div className="p-3 rounded bg-surface border border-outline-variant text-on-surface-variant font-mono text-xs space-y-1">
                <p className="text-emerald-400">[INFO] 2026-08-11 23:00:01 - Processing GET /api/v1/books/</p>
                <p className="text-zinc-400">[DEBUG] 2026-08-11 23:00:01 - Authenticated user: Anonymous</p>
                <p className="text-amber-400">[WARN] 2026-08-11 23:00:01 - N+1 query issue detected in serializer</p>
                <p className="text-emerald-400">[INFO] 2026-08-11 23:00:01 - Completed 200 OK in 14.2ms</p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
