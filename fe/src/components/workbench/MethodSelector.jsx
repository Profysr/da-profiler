// components/workbench/MethodSelector.jsx
import { HTTP_METHODS } from './data.js'

function methodClass(method, active) {
  if (!active) {
    if (method === 'GET') return 'method-get-muted'
    if (method === 'POST') return 'method-post-muted'
    if (method === 'PUT' || method === 'PATCH') return 'method-put-muted'
    if (method === 'DELETE') return 'method-delete-muted'
    return 'method-default'
  }
  if (method === 'GET') return 'method-get'
  if (method === 'POST') return 'method-post'
  if (method === 'PUT' || method === 'PATCH') return 'method-put'
  if (method === 'DELETE') return 'method-delete'
  return 'method-default'
}

export function MethodSelector({
  value,
  onChange,
  methods = HTTP_METHODS,
  variant = 'select',
  "data-label": testId = 'method-selector',
}) {
  if (variant === 'pills') {
    return (
      <div
        className="flex items-center gap-1 shrink-0"
        role="group"
        aria-label="Select HTTP method"
        data-label={testId}
      >
        {methods.map((m) => {
          const active = m.id === value
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange?.(m.id)}
              aria-pressed={active}
              title={`Switch to ${m.id}`}
              className={[
                'font-code-sm text-code-sm uppercase px-2.5 py-1 transition-colors',
                methodClass(m.id, active),
              ].join(' ')}
              data-label={`${testId}-pill-${m.id}`}
              data-method={m.id}
              data-active={active}
            >
              {m.id}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className="flex items-center bg-background border border-outline-variant rounded focus-within:border-primary transition-colors h-10 w-48 shrink-0"
      data-label={testId}
    >
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={[
          'bg-transparent font-code-md text-code-md font-bold px-3 py-2 w-full focus:outline-none appearance-none cursor-pointer',
          methodClass(value, true),
        ].join(' ')}
        data-label={`${testId}-select`}
        aria-label="HTTP method"
      >
        {methods.map((m) => (
          <option key={m.id} value={m.id}>
            {m.id}
          </option>
        ))}
      </select>
      <span className="material-symbols-outlined text-outline-variant pr-2 pointer-events-none">
        expand_more
      </span>
    </div>
  )
}
