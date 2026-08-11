// src/components/RequestWorkbench.jsx
import { PaneTabs } from './workbench/PaneTabs.jsx'
import { KeyValueEditor } from './KeyValueEditor.jsx'
import { DjangoRibbon } from './workbench/DjangoRibbon.jsx'

export function RequestWorkbench({
  activeTabId = 'params',
  onTabChange,
  params = [],
  onParamsChange,
  headers = [],
  onHeadersChange,
  bodyType = 'json',
  onBodyTypeChange,
  bodyContent = '{\n  "name": "The Great Gatsby",\n  "author_id": 1\n}',
  onBodyContentChange,
  "data-label": testId = 'request-workbench',
}) {
  const requestTabs = [
    { id: 'params', label: 'Params', count: params.filter((p) => p.enabled && p.key).length },
    { id: 'headers', label: 'Headers', count: headers.filter((h) => h.enabled && h.key).length },
    { id: 'body', label: 'Body' },
    { id: 'auth', label: 'Auth & Context' },
  ]

  return (
    <section
      className="flex-1 flex flex-col bg-background overflow-hidden"
      data-label={testId}
    >
      <div className="flex items-center justify-between border-b border-outline-variant bg-surface/40">
        <PaneTabs
          tabs={requestTabs}
          activeId={activeTabId}
          onChange={onTabChange}
          testId={`${testId}-tabs`}
        />
        <div className="pr-3">
          <DjangoRibbon data-label={`${testId}-ribbon`} />
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto" data-label={`${testId}-content`}>
        {activeTabId === 'params' && (
          <div className="space-y-3">
            <div className="text-xs text-on-surface-variant font-medium">
              Query Parameters
            </div>
            <KeyValueEditor
              pairs={params}
              onChange={onParamsChange}
              keyPlaceholder="Parameter"
              valuePlaceholder="Value"
              descriptionPlaceholder="Description"
            />
          </div>
        )}

        {activeTabId === 'headers' && (
          <div className="space-y-3">
            <div className="text-xs text-on-surface-variant font-medium">
              HTTP Request Headers
            </div>
            <KeyValueEditor
              pairs={headers}
              onChange={onHeadersChange}
              keyPlaceholder="Header"
              valuePlaceholder="Value"
              descriptionPlaceholder="Description"
            />
          </div>
        )}

        {activeTabId === 'body' && (
          <div className="space-y-3 h-full flex flex-col">
            <div className="flex items-center gap-4 text-xs">
              {['none', 'json', 'form-data'].map((type) => (
                <label key={type} className="flex items-center gap-1.5 cursor-pointer text-on-surface">
                  <input
                    type="radio"
                    name="bodyType"
                    value={type}
                    checked={bodyType === type}
                    onChange={(e) => onBodyTypeChange?.(e.target.value)}
                    className="accent-primary"
                  />
                  <span className="uppercase font-mono text-[11px]">{type}</span>
                </label>
              ))}
            </div>

            {bodyType === 'json' && (
              <div className="flex-1 border border-outline-variant rounded bg-surface p-2 font-mono text-xs">
                <textarea
                  value={bodyContent}
                  onChange={(e) => onBodyContentChange?.(e.target.value)}
                  placeholder={'{\n  "key": "value"\n}'}
                  className="w-full h-40 bg-transparent text-on-surface focus:outline-none resize-none font-mono text-xs"
                />
              </div>
            )}

            {bodyType === 'none' && (
              <div className="py-8 text-center text-xs text-on-surface-variant">
                This request does not have a body
              </div>
            )}
          </div>
        )}

        {activeTabId === 'auth' && (
          <div className="space-y-4 max-w-lg">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-on-surface">Authorization Type</label>
              <select className="w-full bg-surface border border-outline-variant rounded p-2 text-xs text-on-surface">
                <option value="none">No Auth</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="session">Django Session Cookie</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
