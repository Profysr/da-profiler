// src/components/KeyValueEditor.jsx
import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'

// ─── Common HTTP request headers with descriptions ───────────────────────────
const COMMON_HEADERS = [
  { key: 'Accept',                   value: 'application/json',       description: 'Media type(s) client accepts' },
  { key: 'Accept-Encoding',          value: 'gzip, deflate, br',      description: 'Accepted content encodings' },
  { key: 'Accept-Language',          value: 'en-US,en;q=0.9',         description: 'Accepted natural languages' },
  { key: 'Authorization',            value: 'Bearer <token>',          description: 'Auth credentials' },
  { key: 'Cache-Control',            value: 'no-cache',               description: 'Directives for caching' },
  { key: 'Content-Type',             value: 'application/json',       description: 'Body media type' },
  { key: 'Cookie',                   value: 'session=<value>',        description: 'Server cookies' },
  { key: 'Host',                     value: 'api.example.com',        description: 'Target host' },
  { key: 'Origin',                   value: 'https://example.com',    description: 'Request origin URL' },
  { key: 'Referer',                  value: 'https://example.com',    description: 'Page making the request' },
  { key: 'User-Agent',               value: 'Mozilla/5.0',            description: 'Client application info' },
  { key: 'X-API-Key',                value: '<api-key>',              description: 'Custom API key header' },
  { key: 'X-Requested-With',         value: 'XMLHttpRequest',         description: 'AJAX request marker' },
  { key: 'X-CSRF-Token',             value: '<csrf-token>',           description: 'CSRF protection token' },
  { key: 'X-Forwarded-For',          value: '127.0.0.1',              description: 'Originating client IP' },
  { key: 'X-Correlation-ID',         value: '<uuid>',                 description: 'Request tracking ID' },
  { key: 'If-None-Match',            value: '"<etag>"',               description: 'Conditional GET (ETag)' },
  { key: 'If-Modified-Since',        value: 'Mon, 01 Jan 2024 00:00:00 GMT', description: 'Conditional GET (date)' },
  { key: 'Range',                    value: 'bytes=0-1023',           description: 'Partial content range' },
  { key: 'Prefer',                   value: 'respond-async',          description: 'Server-behaviour preference' },
]

// ─── AutoComplete cell ────────────────────────────────────────────────────────
function AutocompleteInput({ value, onChange, placeholder, suggestions, className }) {
  const [open, setOpen] = useState(false)
  const [filtered, setFiltered] = useState([])
  const wrapRef = useRef(null)

  const handleChange = (v) => {
    onChange(v)
    const q = v.toLowerCase()
    const matches = q
      ? suggestions.filter((s) => s.toLowerCase().includes(q))
      : suggestions
    setFiltered(matches.slice(0, 8))
    setOpen(matches.length > 0)
  }

  const pick = (s) => {
    onChange(s)
    setOpen(false)
  }

  // close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={wrapRef} className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          const q = value.toLowerCase()
          const matches = q
            ? suggestions.filter((s) => s.toLowerCase().includes(q))
            : suggestions
          setFiltered(matches.slice(0, 8))
          if (matches.length > 0) setOpen(true)
        }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul
          className="absolute z-50 top-full left-0 mt-0.5 w-max min-w-full max-w-[280px] bg-surface-container border border-outline-variant rounded shadow-lg overflow-hidden text-[11px] font-sans"
          role="listbox"
        >
          {filtered.map((s) => (
            <li
              key={s}
              role="option"
              onMouseDown={(e) => { e.preventDefault(); pick(s) }}
              className="px-2.5 py-1.5 cursor-pointer text-on-surface hover:bg-primary/15 hover:text-primary transition-colors truncate"
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Main KeyValueEditor ──────────────────────────────────────────────────────
export function KeyValueEditor({
  pairs = [],
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  descriptionPlaceholder = 'Description',
  showDescription = true,
  /** Pass COMMON_HEADERS to enable header autocomplete */
  headerMode = false,
}) {
  const handleUpdate = (index, field, val) => {
    const updated = [...pairs]
    updated[index] = { ...updated[index], [field]: val }
    // If in headerMode and user picks a known header name, auto-fill value
    if (headerMode && field === 'key') {
      const preset = COMMON_HEADERS.find((h) => h.key.toLowerCase() === val.toLowerCase())
      if (preset && !updated[index].value) {
        updated[index].value = preset.value
        updated[index].description = preset.description
      }
    }
    onChange?.(updated)
  }

  const handleToggle = (index) => {
    const updated = [...pairs]
    updated[index] = { ...updated[index], enabled: !updated[index].enabled }
    onChange?.(updated)
  }

  const handleAdd = () => {
    onChange?.([...pairs, { enabled: true, key: '', value: '', description: '' }])
  }

  const handleRemove = (index) => {
    const updated = pairs.filter((_, i) => i !== index)
    onChange?.(updated)
  }

  const headerKeySuggestions = COMMON_HEADERS.map((h) => h.key)
  const inputClass = 'w-full bg-transparent px-1.5 py-0.5 focus:outline-none focus:bg-surface-container-high rounded font-mono text-[11px] text-on-surface placeholder:text-on-surface-variant/40'

  return (
    <div className="space-y-2 select-none">
      <div className="border border-outline-variant rounded overflow-visible bg-surface">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-label-caps uppercase text-[10px]">
              <th className="p-2 w-8 text-center border-r border-outline-variant">✓</th>
              <th className="p-2 border-r border-outline-variant">{keyPlaceholder}</th>
              <th className="p-2 border-r border-outline-variant">{valuePlaceholder}</th>
              {showDescription && <th className="p-2 border-r border-outline-variant">{descriptionPlaceholder}</th>}
              <th className="p-2 w-10 text-center">Del</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50 font-mono text-xs">
            {pairs.map((row, idx) => (
              <tr
                key={idx}
                className={row.enabled ? 'bg-surface' : 'bg-surface-container-low/40 opacity-60'}
              >
                <td className="p-1 text-center border-r border-outline-variant">
                  <input
                    type="checkbox"
                    checked={row.enabled ?? true}
                    onChange={() => handleToggle(idx)}
                    className="rounded accent-primary cursor-pointer"
                  />
                </td>

                {/* Key cell — autocomplete for headers */}
                <td className="p-1 border-r border-outline-variant min-w-40">
                  {headerMode ? (
                    <AutocompleteInput
                      value={row.key || ''}
                      onChange={(v) => handleUpdate(idx, 'key', v)}
                      placeholder={keyPlaceholder}
                      suggestions={headerKeySuggestions}
                      className={inputClass}
                    />
                  ) : (
                    <input
                      type="text"
                      value={row.key || ''}
                      onChange={(e) => handleUpdate(idx, 'key', e.target.value)}
                      placeholder={keyPlaceholder}
                      className={inputClass}
                    />
                  )}
                </td>

                {/* Value cell */}
                <td className="p-1 border-r border-outline-variant min-w-[160px]">
                  <input
                    type="text"
                    value={row.value || ''}
                    onChange={(e) => handleUpdate(idx, 'value', e.target.value)}
                    placeholder={valuePlaceholder}
                    className={inputClass}
                  />
                </td>

                {/* Description cell */}
                {showDescription && (
                  <td className="p-1 border-r border-outline-variant min-w-[120px]">
                    <input
                      type="text"
                      value={row.description || ''}
                      onChange={(e) => handleUpdate(idx, 'description', e.target.value)}
                      placeholder={descriptionPlaceholder}
                      className={`${inputClass} font-sans`}
                    />
                  </td>
                )}

                <td className="p-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1 text-on-surface-variant hover:text-rose-400 transition-colors"
                    title="Remove row"
                  >
                    <Trash2 className="w-3.5 h-3.5 mx-auto" />
                  </button>
                </td>
              </tr>
            ))}

            {pairs.length === 0 && (
              <tr>
                <td
                  colSpan={showDescription ? 5 : 4}
                  className="p-4 text-center text-on-surface-variant italic"
                >
                  No entries. Click "Add" to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="flex items-center gap-1 text-xs text-primary font-medium hover:underline pt-1"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Row</span>
      </button>
    </div>
  )
}
