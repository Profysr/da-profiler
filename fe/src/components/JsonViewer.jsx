// src/components/JsonViewer.jsx
import { useState, useCallback, useMemo } from 'react'
import { JsonView, allExpanded, collapseAllNested, darkStyles } from 'react-json-view-lite'
import 'react-json-view-lite/dist/index.css'
import { CopyButton } from './ui/CopyButton.jsx'
import { ChevronsUpDown, ChevronsDownUp, CircleAlert } from 'lucide-react'

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

export function JsonViewer({
  data,
  editable = false,
  onChange,
  className = '',
  initialViewMode = 'pretty',
  showToolbar = true,
}) {
  const [viewMode, setViewMode] = useState(initialViewMode) // 'pretty' | 'raw'
  const [expandState, setExpandState] = useState(null) // null | true | false

  // Parse string data if needed
  const parsedData = useMemo(() => {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data)
      } catch {
        return null
      }
    }
    return data ?? null
  }, [data])

  const jsonString = useMemo(() => {
    if (typeof data === 'string') return data
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return ''
    }
  }, [data])

  const expandFn = useCallback(
    (level) => {
      if (expandState === true) return allExpanded
      if (expandState === false) return collapseAllNested
      return level < 1
    },
    [expandState]
  )

  const handleRawChange = (e) => {
    const val = e.target.value
    onChange?.(val)
  }

  const handlePrettify = () => {
    if (parsedData) {
      onChange?.(JSON.stringify(parsedData, null, 2))
    }
  }

  return (
    <div className={`flex flex-col border border-outline-variant rounded-lg bg-surface-container-lowest overflow-hidden ${className}`}>
      {showToolbar && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-outline-variant bg-surface-container shrink-0">
          {/* Mode Toggle */}
          <div className="flex items-center gap-0.5 bg-surface-container-high border border-outline-variant/60 rounded p-0.5 text-[10px] font-semibold">
            {['pretty', 'raw'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setViewMode(m)}
                className={`px-2.5 py-0.5 rounded transition-colors capitalize ${
                  viewMode === m
                    ? 'bg-primary/20 text-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Expand/Collapse buttons */}
          {viewMode === 'pretty' && (
            <div className="flex items-center gap-0.5 bg-surface-container-high border border-outline-variant/60 rounded p-0.5">
              <button
                type="button"
                onClick={() => setExpandState(true)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                  expandState === true ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <ChevronsUpDown size={12} /> Expand All
              </button>
              <button
                type="button"
                onClick={() => setExpandState(false)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                  expandState === false ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <ChevronsDownUp size={12} /> Collapse All
              </button>
            </div>
          )}

          {/* Prettify button */}
          {viewMode === 'raw' && editable && (
            <button
              type="button"
              onClick={handlePrettify}
              className="text-[10px] text-primary hover:underline"
            >
              Prettify
            </button>
          )}

          <div className="ml-auto">
            <CopyButton text={jsonString} />
          </div>
        </div>
      )}

      {/* Content View */}
      {viewMode === 'pretty' ? (
        <div className="flex-1 p-3 overflow-auto">
          {parsedData !== null ? (
            <JsonView
              data={parsedData}
              shouldExpandNode={expandFn}
              clickToExpandNode
              style={darkJsonStyles}
            />
          ) : (
            <div className="flex items-center gap-2 py-4 text-xs text-rose-400">
              <CircleAlert size={14} />
              <span>Invalid JSON data</span>
            </div>
          )}
        </div>
      ) : editable ? (
        <textarea
          value={typeof data === 'string' ? data : jsonString}
          onChange={handleRawChange}
          placeholder={'{\n  "key": "value"\n}'}
          spellCheck={false}
          className="flex-1 w-full bg-transparent text-on-surface focus:outline-none resize-none font-mono text-xs p-3 min-h-[140px]"
        />
      ) : (
        <pre className="flex-1 p-3 text-emerald-300 font-mono text-xs overflow-auto whitespace-pre-wrap break-all">
          {jsonString}
        </pre>
      )}
    </div>
  )
}
