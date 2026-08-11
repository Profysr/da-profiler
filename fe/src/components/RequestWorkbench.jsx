// src/components/RequestWorkbench.jsx
import { useState, useCallback } from 'react'
import { JsonView, allExpanded, collapseAllNested, darkStyles } from 'react-json-view-lite'
import 'react-json-view-lite/dist/index.css'
import { PaneTabs } from './PaneTabs.jsx'
import { KeyValueEditor } from './KeyValueEditor.jsx'
import { DjangoRibbon } from './DjangoRibbon.jsx'
import { Trash2, Upload, Plus, ChevronsUpDown, ChevronsDownUp, CircleAlert } from 'lucide-react'

// ─── Form Data Editor ─────────────────────────────────────────────────────────
// Supports both text fields and file upload fields (multipart/form-data)
function FormDataEditor({ fields = [], onChange }) {
  const update = (idx, patch) => {
    const next = [...fields]
    next[idx] = { ...next[idx], ...patch }
    onChange?.(next)
  }

  const remove = (idx) => onChange?.(fields.filter((_, i) => i !== idx))

  const add = (type = 'text') => {
    onChange?.([...fields, { enabled: true, key: '', value: '', type, description: '', file: null }])
  }

  const inputBase =
    'w-full bg-transparent px-1.5 py-0.5 focus:outline-none focus:bg-surface-container-high rounded font-mono text-[11px] text-on-surface placeholder:text-on-surface-variant/40'

  return (
    <div className="space-y-2 select-none">
      <div className="border border-outline-variant rounded overflow-visible bg-surface">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-label-caps uppercase text-[10px]">
              <th className="p-2 w-8 text-center border-r border-outline-variant">✓</th>
              <th className="p-2 w-24 border-r border-outline-variant">Type</th>
              <th className="p-2 border-r border-outline-variant">Key / Field Name</th>
              <th className="p-2 border-r border-outline-variant">Value / File</th>
              <th className="p-2 border-r border-outline-variant">Description</th>
              <th className="p-2 w-10 text-center">Del</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50 font-mono text-xs">
            {fields.map((row, idx) => (
              <tr
                key={idx}
                className={row.enabled ? 'bg-surface' : 'bg-surface-container-low/40 opacity-60'}
              >
                {/* Enable toggle */}
                <td className="p-1 text-center border-r border-outline-variant">
                  <input
                    type="checkbox"
                    checked={row.enabled ?? true}
                    onChange={() => update(idx, { enabled: !row.enabled })}
                    className="rounded accent-primary cursor-pointer"
                  />
                </td>

                {/* Type toggle: text | file */}
                <td className="p-1 border-r border-outline-variant">
                  <select
                    value={row.type || 'text'}
                    onChange={(e) => update(idx, { type: e.target.value, value: '', file: null })}
                    className="w-full bg-surface-container border border-outline-variant/50 rounded px-1.5 py-0.5 text-[11px] text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="text">Text</option>
                    <option value="file">File</option>
                  </select>
                </td>

                {/* Key */}
                <td className="p-1 border-r border-outline-variant min-w-[130px]">
                  <input
                    type="text"
                    value={row.key || ''}
                    onChange={(e) => update(idx, { key: e.target.value })}
                    placeholder="field_name"
                    className={inputBase}
                  />
                </td>

                {/* Value or File picker */}
                <td className="p-1 border-r border-outline-variant min-w-[180px]">
                  {row.type === 'file' ? (
                    <label className="flex items-center gap-1.5 cursor-pointer group">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded border border-outline-variant bg-surface-container text-[11px] text-on-surface-variant group-hover:border-primary group-hover:text-primary transition-colors">
                        <Upload className="w-3 h-3" />
                        {row.file ? row.file.name : 'Choose file'}
                      </span>
                      <input
                        type="file"
                        className="sr-only"
                        onChange={(e) => update(idx, { file: e.target.files?.[0] ?? null })}
                      />
                    </label>
                  ) : (
                    <input
                      type="text"
                      value={row.value || ''}
                      onChange={(e) => update(idx, { value: e.target.value })}
                      placeholder="value"
                      className={inputBase}
                    />
                  )}
                </td>

                {/* Description */}
                <td className="p-1 border-r border-outline-variant min-w-[120px]">
                  <input
                    type="text"
                    value={row.description || ''}
                    onChange={(e) => update(idx, { description: e.target.value })}
                    placeholder="Description"
                    className={`${inputBase} font-sans`}
                  />
                </td>

                {/* Remove */}
                <td className="p-1 text-center">
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="p-1 text-on-surface-variant hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 mx-auto" />
                  </button>
                </td>
              </tr>
            ))}

            {fields.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-on-surface-variant italic">
                  No form fields. Add a text field or a file.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add buttons */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => add('text')}
          className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
        >
          <Plus size={13} />
          Add Text Field
        </button>
        <span className="text-outline-variant">·</span>
        <button
          type="button"
          onClick={() => add('file')}
          className="flex items-center gap-1 text-xs text-secondary font-medium hover:underline"
        >
          <Upload className="w-3.5 h-3.5" />
          Add File Field
        </button>
      </div>
    </div>
  )
}

// ─── Shared dark JSON styles (same as ResponseWorkbench) ─────────────────
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

// ─── Body type radio selector ─────────────────────────────────────────────────
const BODY_TYPES = [
  { id: 'none',      label: 'none' },
  { id: 'json',      label: 'JSON' },
  { id: 'form-data', label: 'form-data' },
  { id: 'urlencoded',label: 'x-www-form-urlencoded' },
  { id: 'raw',       label: 'raw text' },
]

// ─── RequestWorkbench ─────────────────────────────────────────────────────────
export function RequestWorkbench({
  activeTabId = 'queryParams',
  onTabChange,
  pathParams = [],
  onPathParamsChange,
  queryParams = [],
  onQueryParamsChange,
  headers = [],
  onHeadersChange,
  bodyType = 'json',
  onBodyTypeChange,
  bodyContent = '{\n  "name": "The Great Gatsby",\n  "author_id": 1\n}',
  onBodyContentChange,
  formData = [],
  onFormDataChange,
  urlencodedData = [],
  onUrlencodedDataChange,
  'data-label': testId = 'request-workbench',
}) {
  // Body JSON view state
  const [bodyViewMode, setBodyViewMode] = useState('raw')   // 'raw' | 'pretty'
  const [bodyExpandState, setBodyExpandState] = useState(null) // null | true | false

  const bodyExpandFn = useCallback(
    bodyExpandState === true
      ? allExpanded
      : bodyExpandState === false
        ? collapseAllNested
        : (level) => level < 1,
    [bodyExpandState]
  )

  // Parse body JSON safely for the tree viewer
  let parsedBodyJson = null
  try { parsedBodyJson = JSON.parse(bodyContent) } catch { /* invalid — fall back to raw */ }

  const requestTabs = [
    { id: 'pathParams',  label: 'Path Params',  count: pathParams.filter((p) => p.enabled && p.key).length },
    { id: 'queryParams', label: 'Query Params',  count: queryParams.filter((q) => q.enabled && q.key).length },
    { id: 'headers',     label: 'Headers',       count: headers.filter((h) => h.enabled && h.key).length },
    { id: 'body',        label: 'Body' },
    { id: 'auth',        label: 'Auth & Context' },
  ]

  return (
    <section
      className="flex-1 flex flex-col bg-surface-container-low overflow-hidden"
      data-label={testId}
    >
      {/* Tab bar + Django ribbon */}
      <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container shrink-0">
        <PaneTabs
          tabs={requestTabs}
          activeId={activeTabId}
          onChange={onTabChange}
          testId={`${testId}-tabs`}
        />
        <div className="pr-3 shrink-0">
          <DjangoRibbon data-label={`${testId}-ribbon`} />
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 p-4 overflow-y-auto" data-label={`${testId}-content`}>

        {/* ── Path Params ─────────────────────────────────────────── */}
        {activeTabId === 'pathParams' && (
          <div className="space-y-3">
            <p className="text-xs text-on-surface-variant font-medium">
              URL Path Variables (e.g.{' '}
              <code className="text-primary font-mono">:id</code> or{' '}
              <code className="text-primary font-mono">&#123;book_id&#125;</code>)
            </p>
            <KeyValueEditor
              pairs={pathParams}
              onChange={onPathParamsChange}
              keyPlaceholder="Path Variable (e.g. id)"
              valuePlaceholder="Value (e.g. 42)"
              descriptionPlaceholder="Description"
            />
          </div>
        )}

        {/* ── Query Params ─────────────────────────────────────────── */}
        {activeTabId === 'queryParams' && (
          <div className="space-y-3">
            <p className="text-xs text-on-surface-variant font-medium">
              URL Query String Parameters (e.g.{' '}
              <code className="text-primary font-mono">?page=1&amp;size=10</code>)
            </p>
            <KeyValueEditor
              pairs={queryParams}
              onChange={onQueryParamsChange}
              keyPlaceholder="Parameter Key"
              valuePlaceholder="Value"
              descriptionPlaceholder="Description"
            />
          </div>
        )}

        {/* ── Headers ─────────────────────────────────────────────── */}
        {activeTabId === 'headers' && (
          <div className="space-y-3">
            <p className="text-xs text-on-surface-variant font-medium">
              HTTP Request Headers — start typing to autocomplete common headers
            </p>
            <KeyValueEditor
              pairs={headers}
              onChange={onHeadersChange}
              keyPlaceholder="Header Name"
              valuePlaceholder="Header Value"
              descriptionPlaceholder="Description"
              headerMode
            />
          </div>
        )}

        {/* ── Body ────────────────────────────────────────────────── */}
        {activeTabId === 'body' && (
          <div className="space-y-4 flex flex-col h-full">

            {/* Body type selector */}
            <div className="flex items-center gap-4 text-xs shrink-0">
              {BODY_TYPES.map(({ id, label }) => (
                <label
                  key={id}
                  className="flex items-center gap-1.5 cursor-pointer text-on-surface select-none"
                >
                  <input
                    type="radio"
                    name="bodyType"
                    value={id}
                    checked={bodyType === id}
                    onChange={(e) => onBodyTypeChange?.(e.target.value)}
                    className="accent-primary"
                  />
                  <span className="font-mono text-[11px] font-semibold">{label}</span>
                </label>
              ))}
            </div>

            {/* none */}
            {bodyType === 'none' && (
              <div className="py-8 text-center text-xs text-on-surface-variant">
                This request does not send a body payload.
              </div>
            )}

            {/* JSON editor */}
            {bodyType === 'json' && (
              <div className="flex-1 border border-outline-variant rounded-lg bg-surface-container-lowest shadow-inner overflow-hidden flex flex-col">
                {/* Toolbar */}
                <div className="flex items-center gap-2 px-3 py-1.5 border-b border-outline-variant bg-surface-container shrink-0">
                  {/* Pretty / Raw toggle */}
                  <div className="flex items-center gap-0.5 bg-surface-container-high border border-outline-variant/60 rounded p-0.5 text-[10px] font-semibold">
                    {['raw', 'pretty'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setBodyViewMode(m)}
                        className={`px-2.5 py-0.5 rounded transition-colors capitalize ${
                          bodyViewMode === m
                            ? 'bg-primary/20 text-primary'
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  {/* Expand / Collapse (only in pretty mode) */}
                  {bodyViewMode === 'pretty' && (
                    <div className="flex items-center gap-0.5 bg-surface-container-high border border-outline-variant/60 rounded p-0.5">
                      <button
                        type="button"
                        onClick={() => setBodyExpandState(true)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                          bodyExpandState === true ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <ChevronsUpDown size={12} />
                        Expand All
                      </button>
                      <button
                        type="button"
                        onClick={() => setBodyExpandState(false)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                          bodyExpandState === false ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <ChevronsDownUp size={12} />
                        Collapse All
                      </button>
                    </div>
                  )}

                  {/* Prettify shortcut in raw mode */}
                  {bodyViewMode === 'raw' && (
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          onBodyContentChange?.(JSON.stringify(JSON.parse(bodyContent), null, 2))
                        } catch { /* invalid JSON */ }
                      }}
                      className="ml-auto text-[10px] text-primary hover:underline"
                    >
                      Prettify
                    </button>
                  )}
                </div>

                {/* Raw textarea */}
                {bodyViewMode === 'raw' && (
                  <textarea
                    value={bodyContent}
                    onChange={(e) => onBodyContentChange?.(e.target.value)}
                    placeholder={'{\n  "key": "value"\n}'}
                    spellCheck={false}
                    className="flex-1 w-full bg-transparent text-on-surface focus:outline-none resize-none font-mono text-xs p-3 min-h-[140px]"
                  />
                )}

                {/* Pretty JSON tree */}
                {bodyViewMode === 'pretty' && (
                  <div className="flex-1 p-3 overflow-y-auto">
                    {parsedBodyJson !== null ? (
                      <JsonView
                        data={parsedBodyJson}
                        shouldExpandNode={bodyExpandFn}
                        clickToExpandNode
                        style={darkJsonStyles}
                      />
                    ) : (
                      <div className="flex items-center gap-2 py-4 text-xs text-rose-400">
                        <CircleAlert size={14} />
                        <span>Invalid JSON — fix syntax errors in Raw mode to preview the tree.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}


            {/* form-data */}
            {bodyType === 'form-data' && (
              <div className="space-y-2">
                <p className="text-xs text-on-surface-variant font-medium">
                  <code className="text-primary font-mono">multipart/form-data</code> — supports text fields and file uploads
                </p>
                <FormDataEditor fields={formData} onChange={onFormDataChange} />
              </div>
            )}

            {/* x-www-form-urlencoded */}
            {bodyType === 'urlencoded' && (
              <div className="space-y-2">
                <p className="text-xs text-on-surface-variant font-medium">
                  <code className="text-primary font-mono">application/x-www-form-urlencoded</code> — key-value pairs URL-encoded in body
                </p>
                <KeyValueEditor
                  pairs={urlencodedData}
                  onChange={onUrlencodedDataChange}
                  keyPlaceholder="Field Name"
                  valuePlaceholder="Value"
                  descriptionPlaceholder="Description"
                />
              </div>
            )}

            {/* raw text */}
            {bodyType === 'raw' && (
              <div className="flex-1 border border-outline-variant rounded-lg bg-surface-container-lowest shadow-inner overflow-hidden flex flex-col">
                <div className="flex items-center px-3 py-1.5 border-b border-outline-variant bg-surface-container shrink-0">
                  <span className="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-widest">Raw Text</span>
                </div>
                <textarea
                  value={bodyContent}
                  onChange={(e) => onBodyContentChange?.(e.target.value)}
                  placeholder="Enter raw body..."
                  spellCheck={false}
                  className="flex-1 w-full bg-transparent text-on-surface focus:outline-none resize-none font-mono text-xs p-3 min-h-[140px]"
                />
              </div>
            )}
          </div>
        )}

        {/* ── Auth & Context ───────────────────────────────────────── */}
        {activeTabId === 'auth' && (
          <div className="space-y-4 max-w-lg">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-on-surface">Authorization Type</label>
              <select className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary">
                <option value="none">No Auth</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="session">Django Session Cookie</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-on-surface">Token / Value</label>
              <input
                type="text"
                placeholder="Paste your token here..."
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 font-mono text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
