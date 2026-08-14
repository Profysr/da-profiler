// src/components/RequestWorkbench.jsx
import { PaneTabs } from './PaneTabs.jsx'
import { KeyValueEditor } from './KeyValueEditor.jsx'
// import { DjangoRibbon } from './DjangoRibbon.jsx'
import { Trash2, Upload } from 'lucide-react'
import { useRequestStore } from '../store/requestStore.js'
import { useUiStore } from '../store/uiStore.js'
import { JsonViewer } from './JsonViewer.jsx'

// ─── Shared Theme / Constants ────────────────────────────────────────────────
const BODY_TYPES = [
  { id: 'none', label: 'none' },
  { id: 'json', label: 'JSON' },
  { id: 'form-data', label: 'form-data' },
  { id: 'urlencoded', label: 'x-www-form-urlencoded' },
]

// ─── Sub-Component: Form Data Editor ───────────────────────────────────────
function FormDataEditor({ fields = [], onChange }) {
  const update = (idx, patch) => {
    const next = [...fields]
    next[idx] = { ...next[idx], ...patch }
    onChange?.(next)
  }

  const remove = (idx) => onChange?.(fields.filter((_, i) => i !== idx))

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
                <td className="p-1 text-center border-r border-outline-variant">
                  <input
                    type="checkbox"
                    checked={row.enabled ?? true}
                    onChange={() => update(idx, { enabled: !row.enabled })}
                    className="rounded accent-primary cursor-pointer"
                  />
                </td>
                <td className="p-1 border-r border-outline-variant">
                  <select
                    value={row.type || 'text'}
                    onChange={(e) => update(idx, { type: e.target.value, value: '', file: null })}
                    className="w-full bg-surface-container border border-outline-variant/50 rounded px-1.5 py-0.5 text-[11px] text-on-surface focus:outline-none cursor-pointer"
                  >
                    <option value="text">Text</option>
                    <option value="file">File</option>
                  </select>
                </td>
                <td className="p-1 border-r border-outline-variant min-w-35">
                  <input
                    type="text"
                    value={row.key || ''}
                    onChange={(e) => update(idx, { key: e.target.value })}
                    placeholder="field_name"
                    className={inputBase}
                  />
                </td>
                <td className="p-1 border-r border-outline-variant min-w-45">
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
                <td className="p-1 border-r border-outline-variant min-w-[120px]">
                  <input
                    type="text"
                    value={row.description || ''}
                    onChange={(e) => update(idx, { description: e.target.value })}
                    placeholder="Description"
                    className={`${inputBase} font-sans`}
                  />
                </td>
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
          </tbody>
        </table>
      </div>
    </div>
  )
}


// ─── Main Component: RequestWorkbench ─────────────────────────────────────────
export function RequestWorkbench({ 'data-label': testId = 'request-workbench' }) {
  const { activeRequestTab, setActiveRequestTab } = useUiStore()

  const {
    pathParams,
    queryParams,
    headers,
    bodyType,
    bodyContent,
    formData,
    urlencodedData,
    setPathParams,
    setQueryParams,
    setHeaders,
    setBodyType,
    setFormData,
    setUrlencodedData,
  } = useRequestStore()

  const updateRequestState = (updates) => useRequestStore.setState(updates)

  // Count helper for active items
  const countEnabled = (items = []) => items.filter((i) => i.enabled && i.key).length

  // Declarative Tab Configuration for PaneTabs navigation
  const requestTabs = [
    { id: 'pathParams', label: 'Path Params', count: countEnabled(pathParams) },
    { id: 'queryParams', label: 'Query Params', count: countEnabled(queryParams) },
    { id: 'headers', label: 'Headers', count: countEnabled(headers) },
    { id: 'body', label: 'Body' },
  ]

  // Config-driven map to render key-value key parameter tabs without JSX duplication
  const keyValueTabConfigs = [
    {
      id: 'pathParams',
      description: (
        <>
          URL Path Variables (e.g. <code className="text-primary font-mono">:id</code> or{' '}
          <code className="text-primary font-mono">&#123;book_id&#125;</code>)
        </>
      ),
      pairs: pathParams,
      onChange: setPathParams,
      keyPlaceholder: 'Path Variable (e.g. id)',
      valuePlaceholder: 'Value (e.g. 42)',
    },
    {
      id: 'queryParams',
      description: (
        <>
          URL Query String Parameters (e.g.{' '}
          <code className="text-primary font-mono">?page=1&size=10</code>)
        </>
      ),
      pairs: queryParams,
      onChange: setQueryParams,
      keyPlaceholder: 'Parameter Key',
      valuePlaceholder: 'Value',
    },
    {
      id: 'headers',
      description: 'HTTP Request Headers — start typing to autocomplete common headers',
      pairs: headers,
      onChange: setHeaders,
      keyPlaceholder: 'Header Name',
      valuePlaceholder: 'Header Value',
      headerMode: true,
    },
  ]

  return (
    <section
      className="flex-1 flex flex-col bg-surface-container-low overflow-hidden"
      data-label={testId}
    >
      {/* Tab bar header */}
      <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container shrink-0">
        <PaneTabs
          tabs={requestTabs}
          activeId={activeRequestTab}
          onChange={setActiveRequestTab}
          testId={`${testId}-tabs`}
        />
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-4 overflow-y-auto" data-label={`${testId}-content`}>
        {/* Render Key-Value Pair Tabs Dynamically */}
        {keyValueTabConfigs.map(
          (tab) =>
            activeRequestTab === tab.id && (
              <div key={tab.id} className="space-y-3">
                <p className="text-xs text-on-surface-variant font-medium">{tab.description}</p>
                <KeyValueEditor
                  pairs={tab.pairs}
                  onChange={tab.onChange}
                  keyPlaceholder={tab.keyPlaceholder}
                  valuePlaceholder={tab.valuePlaceholder}
                  descriptionPlaceholder="Description"
                  headerMode={tab.headerMode}
                />
              </div>
            )
        )}

        {/* Render Body Tab */}
        {activeRequestTab === 'body' && (
          <div className="space-y-4 flex flex-col h-full">
            {/* Body Type Radio Controls */}
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
                    onChange={(e) => setBodyType?.(e.target.value)}
                    className="accent-primary"
                  />
                  <span className="font-mono text-[11px] font-semibold">{label}</span>
                </label>
              ))}
            </div>

            {/* Body Panels */}
            {bodyType === 'none' && (
              <div className="py-8 text-center text-xs text-on-surface-variant">
                This request does not send a body payload.
              </div>
            )}

            {bodyType === 'json' && (
              <JsonViewer
                data={bodyContent}
                editable
                onChange={(val) => updateRequestState({ bodyContent: val })}
                className="flex-1"
                initialViewMode="raw"
              />
            )}

            {bodyType === 'form-data' && (
              <div className="space-y-2">
                <p className="text-xs text-on-surface-variant font-medium">
                  <code className="text-primary font-mono">multipart/form-data</code> — supports text
                  fields and file uploads
                </p>
                <FormDataEditor fields={formData} onChange={setFormData} />
              </div>
            )}

            {bodyType === 'urlencoded' && (
              <div className="space-y-2">
                <p className="text-xs text-on-surface-variant font-medium">
                  <code className="text-primary font-mono">application/x-www-form-urlencoded</code>{' '}
                  — key-value pairs URL-encoded in body
                </p>
                <KeyValueEditor
                  pairs={urlencodedData}
                  onChange={setUrlencodedData}
                  keyPlaceholder="Field Name"
                  valuePlaceholder="Value"
                  descriptionPlaceholder="Description"
                />
              </div>
            )}
          </div>
        )}
        
      </div>
    </section>
  )
}