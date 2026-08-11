// src/components/ResponseWorkbench.jsx
import { useState, useCallback } from 'react'
import { JsonView, allExpanded, collapseAllNested, darkStyles } from 'react-json-view-lite'
import 'react-json-view-lite/dist/index.css'
import { PaneTabs } from './PaneTabs.jsx'
import { ResponseMetrics } from './ResponseMetrics.jsx'
import { CopyButton } from './ui/CopyButton.jsx'
import { Loader2, ChevronsUpDown, ChevronsDownUp, TriangleAlert, CheckCircle, Info } from 'lucide-react'

// ─── Dark-themed JSON viewer styles ─────────────────────────────────────────
const darkJsonStyles = {
  ...darkStyles,
  container: 'bg-transparent text-[12px] font-mono leading-5',
  basicChildStyle: 'ml-4 border-l border-outline-variant/20 pl-2',
  label: 'text-sky-300 mr-1 font-semibold',
  nullValue: 'text-zinc-500 italic',
  undefinedValue: 'text-zinc-500 italic',
  numberValue: 'text-amber-300',
  stringValue: 'text-emerald-300',
  booleanValue: 'text-violet-400',
  punctuation: 'text-zinc-400',
  expandIcon: 'text-zinc-500 hover:text-primary cursor-pointer select-none mr-1 transition-colors',
  collapseIcon: 'text-zinc-500 hover:text-primary cursor-pointer select-none mr-1 transition-colors',
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_RESPONSE = {
  status: 'success',
  message: 'Fetched 4 books from database',
  count: 4,
  results: [
    { id: 1, title: 'The Great Gatsby',       author: { id: 1, name: 'F. Scott Fitzgerald' } },
    { id: 2, title: 'Tender Is the Night',    author: { id: 1, name: 'F. Scott Fitzgerald' } },
    { id: 3, title: 'To Kill a Mockingbird',  author: { id: 2, name: 'Harper Lee' } },
    { id: 4, title: 'Go Set a Watchman',      author: { id: 2, name: 'Harper Lee' } },
  ],
}

const MOCK_RESPONSE_HEADERS = [
  { key: 'Content-Type',         value: 'application/json' },
  { key: 'Vary',                 value: 'Accept, Cookie' },
  { key: 'Allow',                value: 'GET, POST, HEAD, OPTIONS' },
  { key: 'X-Frame-Options',      value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Content-Length',       value: '312' },
  { key: 'X-DRF-Response-Time',  value: '14.2ms' },
]

const MOCK_SQL_QUERIES = [
  { sql: 'SELECT "myapp_book"."id", "myapp_book"."title" FROM "myapp_book"', time: '0.4ms', n1: false },
  { sql: 'SELECT "myapp_author"."id", "myapp_author"."name" FROM "myapp_author" WHERE "myapp_author"."id" = 1', time: '0.8ms', n1: true },
  { sql: 'SELECT "myapp_author"."id", "myapp_author"."name" FROM "myapp_author" WHERE "myapp_author"."id" = 1', time: '0.8ms', n1: true },
  { sql: 'SELECT "myapp_author"."id", "myapp_author"."name" FROM "myapp_author" WHERE "myapp_author"."id" = 2', time: '0.8ms', n1: true },
]

// ─── View-mode pill toggle (Pretty / Raw) ─────────────────────────────────────
function ViewToggle({ mode, onChange }) {
  return (
    <div className="flex items-center gap-0.5 bg-surface-container border border-outline-variant rounded p-0.5 text-[10px] font-semibold">
      {['pretty', 'raw'].map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`px-2.5 py-0.5 rounded transition-colors capitalize ${
            mode === m
              ? 'bg-primary/20 text-primary'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  )
}

// ─── ResponseWorkbench ────────────────────────────────────────────────────────
export function ResponseWorkbench({
  activeTabId = 'response',
  onTabChange,
  metrics,
  profileResult,
  loading = false,
  'data-label': testId = 'response-workbench',
}) {
  const [viewMode, setViewMode] = useState('pretty')
  // null = default (collapsed top-level only), true = all expanded, false = all collapsed
  const [expandState, setExpandState] = useState(null)

  const expandFn = useCallback(
    expandState === true
      ? allExpanded
      : expandState === false
        ? collapseAllNested
        : (level) => level < 1,   // default: top-level open
    [expandState]
  )

  const responseTabs = [
    { id: 'response',    label: 'Response' },
    { id: 'headers',     label: 'Headers' },
    { id: 'queries',     label: 'SQL Queries', count: profileResult?.sql_queries?.length || MOCK_SQL_QUERIES.length },
    { id: 'summary',     label: 'Summary' },
    { id: 'sideEffects', label: 'Side Effects' },
    { id: 'logs',        label: 'Logs' },
  ]

  const jsonData   = profileResult?.response?.data || profileResult?.data || MOCK_RESPONSE
  const jsonString = JSON.stringify(jsonData, null, 2)

  return (
    <section
      className="flex-1 flex flex-col bg-background overflow-hidden relative"
      data-label={testId}
    >
      {/* Metrics strip */}
      <ResponseMetrics {...metrics} testId={`${testId}-metrics`} />

      <PaneTabs
        tabs={responseTabs}
        activeId={activeTabId}
        onChange={onTabChange}
        testId={`${testId}-tabs`}
      />

      <div
        className="flex-1 p-4 overflow-y-auto bg-surface-container-lowest text-on-surface relative"
        data-label={`${testId}-content`}
      >
        {/* ── Loading ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center h-full gap-2 text-on-surface-variant">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-xs">Executing target &amp; profiling execution...</span>
          </div>
        ) : (
          <>
            {/* ── 1. Response ─────────────────────────────────────── */}
            {activeTabId === 'response' && (
              <div className="space-y-2">
                {/* Toolbar */}
                <div className="flex items-center gap-2 mb-2">
                  <ViewToggle mode={viewMode} onChange={setViewMode} />
                  {viewMode === 'pretty' && (
                    <div className="flex items-center gap-0.5 bg-surface-container border border-outline-variant rounded p-0.5">
                      <button
                        type="button"
                        title="Expand all"
                        onClick={() => setExpandState(true)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                          expandState === true ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <ChevronsUpDown size={12} />
                        Expand All
                      </button>
                      <button
                        type="button"
                        title="Collapse all"
                        onClick={() => setExpandState(false)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                          expandState === false ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <ChevronsDownUp size={12} />
                        Collapse All
                      </button>
                    </div>
                  )}
                  <div className="ml-auto">
                    <CopyButton text={jsonString} />
                  </div>
                </div>

                {viewMode === 'pretty' ? (
                  <div className="p-3 rounded-lg bg-surface border border-outline-variant overflow-x-auto">
                    <JsonView
                      data={jsonData}
                      shouldExpandNode={expandFn}
                      clickToExpandNode
                      style={darkJsonStyles}
                    />
                  </div>
                ) : (
                  <pre className="p-3 rounded-lg bg-surface border border-outline-variant text-emerald-300 overflow-x-auto font-mono text-xs whitespace-pre-wrap break-all">
                    {jsonString}
                  </pre>
                )}
              </div>
            )}

            {/* ── 2. Response Headers ──────────────────────────────── */}
            {activeTabId === 'headers' && (
              <div className="border border-outline-variant rounded overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant font-label-caps text-[10px] text-on-surface-variant">
                      <th className="p-2.5 border-r border-outline-variant w-1/3">Header</th>
                      <th className="p-2.5">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40">
                    {MOCK_RESPONSE_HEADERS.map((h, i) => (
                      <tr key={i} className="hover:bg-surface-container/50 transition-colors">
                        <td className="p-2.5 font-semibold text-primary border-r border-outline-variant font-mono text-[11px]">
                          {h.key}
                        </td>
                        <td className="p-2.5 text-on-surface-variant font-mono text-[11px]">
                          {h.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── 3. SQL Queries ───────────────────────────────────── */}
            {activeTabId === 'queries' && (
              <div className="space-y-3">
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
                  <TriangleAlert size={14} />
                  <span>Detected N+1 Query: Author fetched 3 times in loop — consider <code className="font-mono">select_related('author')</code></span>
                </div>
                <div className="space-y-2">
                  {MOCK_SQL_QUERIES.map((q, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border ${
                        q.n1
                          ? 'border-amber-500/40 bg-amber-500/5'
                          : 'border-outline-variant bg-surface'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] text-on-surface-variant mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold">QUERY #{idx + 1}</span>
                          {q.n1 && (
                            <span className="px-1.5 py-px rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-bold">
                              N+1
                            </span>
                          )}
                        </div>
                        <span className="text-primary font-mono">{q.time}</span>
                      </div>
                      <code className="text-xs text-on-surface font-mono break-all">{q.sql}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 4. Summary ──────────────────────────────────────── */}
            {activeTabId === 'summary' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Queries Executed',  value: '4',        color: 'text-primary' },
                    { label: 'Duplicate Queries',  value: '3 (N+1)',  color: 'text-amber-400' },
                    { label: 'Total Duration',     value: '14.2 ms',  color: 'text-emerald-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="p-3 rounded-lg border border-outline-variant bg-surface">
                      <span className="text-[10px] font-label-caps uppercase text-on-surface-variant tracking-wider">{label}</span>
                      <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-lg border border-outline-variant bg-surface space-y-2 text-xs">
                  <p className="font-semibold text-on-surface">Performance Suggestions</p>
                  <ul className="list-disc pl-4 space-y-1 text-on-surface-variant">
                    <li>Use <code className="text-primary font-mono">select_related('author')</code> to eliminate 3 duplicate queries.</li>
                    <li>Consider adding a database index on <code className="text-primary font-mono">book.author_id</code>.</li>
                    <li>Enable query caching for repeated identical lookups.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* ── 5. Side Effects ──────────────────────────────────── */}
            {activeTabId === 'sideEffects' && (
              <div className="space-y-3 text-xs">
                <p className="font-semibold text-on-surface">Database Mutations / Side Effects</p>
                <div className="divide-y divide-outline-variant/30 border border-outline-variant rounded-lg overflow-hidden">
                  {[
                    { Icon: CheckCircle, color: 'text-emerald-400', label: 'No database writes (INSERT/UPDATE/DELETE) detected.' },
                    { Icon: CheckCircle, color: 'text-emerald-400', label: 'No Celery tasks spawned during request cycle.' },
                    { Icon: Info,        color: 'text-sky-400',     label: 'Signal listeners triggered: post_init (×4).' },
                    { Icon: Info,        color: 'text-sky-400',     label: 'Middleware: SessionMiddleware, CsrfViewMiddleware, AuthenticationMiddleware.' },
                  ].map(({ Icon: RowIcon, color, label }) => (
                    <div key={label} className="flex items-start gap-2.5 px-3 py-2.5 bg-surface hover:bg-surface-container/40 transition-colors">
                      <RowIcon size={14} className={color} />
                      <span className="text-on-surface-variant">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 6. Logs ──────────────────────────────────────────── */}
            {activeTabId === 'logs' && (
              <div className="p-3 rounded-lg bg-surface border border-outline-variant font-mono text-[11px] space-y-1.5 overflow-x-auto">
                {[
                  { level: 'INFO',  color: 'text-emerald-400', msg: '2026-08-11 23:00:01 - Processing GET /api/v1/books/' },
                  { level: 'DEBUG', color: 'text-zinc-400',    msg: '2026-08-11 23:00:01 - Authenticated user: Anonymous' },
                  { level: 'DEBUG', color: 'text-zinc-400',    msg: '2026-08-11 23:00:01 - QuerySet evaluated: Book.objects.all()' },
                  { level: 'WARN',  color: 'text-amber-400',   msg: '2026-08-11 23:00:01 - N+1 query issue detected in BookSerializer' },
                  { level: 'INFO',  color: 'text-emerald-400', msg: '2026-08-11 23:00:01 - Completed 200 OK in 14.2ms (4 queries)' },
                ].map(({ level, color, msg }, i) => (
                  <p key={i} className={color}>
                    <span className="opacity-60">[{level}]</span> {msg}
                  </p>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
