// src/components/MethodSelector.jsx
import { HTTP_METHODS } from '../utils/workbenchData.js'
import { Icon } from './Icon.jsx'

function getMethodBadgeClass(method) {
  switch (method) {
    case 'GET':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    case 'POST':
      return 'bg-orange-500/15 text-orange-400 border-orange-500/30'
    case 'PUT':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    case 'PATCH':
      return 'bg-teal-500/15 text-teal-400 border-teal-500/30'
    case 'DELETE':
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
    default:
      return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
  }
}

export function MethodSelector({
  value = 'GET',
  onChange,
  methods = HTTP_METHODS,
  "data-label": testId = 'method-selector',
}) {
  const currentBadgeClass = getMethodBadgeClass(value)

  return (
    <div
      className={`flex items-center bg-surface border rounded focus-within:border-primary transition-all h-10 w-36 shrink-0 ${currentBadgeClass}`}
      data-label={testId}
    >
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="bg-transparent font-mono text-xs font-bold px-3 py-2 w-full focus:outline-none appearance-none cursor-pointer text-inherit"
        data-label={`${testId}-select`}
        aria-label="HTTP method"
      >
        {methods.map((m) => (
          <option key={m.id} value={m.id} className="bg-surface text-on-surface">
            {m.id}
          </option>
        ))}
      </select>
      <Icon name="arrow_drop_down" size={14} className="opacity-70 pr-2 pointer-events-none" />
    </div>
  )
}
