// components/profiler/ProfilerHeader.jsx
import { cn } from '../../utils/classNames.js'
import { Play } from 'lucide-react'

/**
 * Profiler header component showing selected route info - matches design
 * Includes the Execute & Profile action button in the header row (Postman style)
 * When a route supports multiple HTTP methods, renders clickable method pills
 * so the user can switch between them without leaving the panel.
 */
export function ProfilerHeader({
  route,
  onRun,
  loading = false,
  selectedMethod,
  onMethodChange,
  "data-label": testId = "profiler-header",
}) {
  if (!route) return null

  const methods = route.methods || [route.method || 'GET']
  const activeMethod = selectedMethod || methods[0]

  const getMethodBadgeClass = (method) => {
    switch (method) {
      case 'GET':    return 'method-get'
      case 'POST':   return 'method-post'
      case 'PUT':
      case 'PATCH':  return 'method-put'
      case 'DELETE': return 'method-delete'
      default:       return ''
    }
  }

  // Muted style for inactive method pills
  const getMethodMutedClass = (method) => {
    switch (method) {
      case 'GET':    return 'border border-[#388e3c]/40 text-[#81c784] bg-[#388e3c]/10 hover:bg-[#388e3c]/20'
      case 'POST':   return 'border border-[#1565c0]/40 text-[#64b5f6] bg-[#1565c0]/10 hover:bg-[#1565c0]/20'
      case 'PUT':
      case 'PATCH':  return 'border border-[#e65100]/40 text-[#ffb74d] bg-[#e65100]/10 hover:bg-[#e65100]/20'
      case 'DELETE': return 'border border-[#c62828]/40 text-[#ef9a9a] bg-[#c62828]/10 hover:bg-[#c62828]/20'
      default:       return 'border border-outline-variant text-on-surface-variant hover:bg-surface-variant'
    }
  }

  return (
    <div
      className="px-4 py-3 border-b border-outline-variant flex-shrink-0 flex flex-col gap-2"
      data-label={testId}
      data-route-path={route.path}
      data-route-method={activeMethod}
    >
      {/* Top row: method pills + path + execute button */}
      <div className="flex items-center gap-3 flex-wrap" data-label={`${testId}-method-path`}>

        {/* Method pills — single badge when only one method, clickable pills when multiple */}
        {methods.length <= 1 ? (
          <span
            className={cn('text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-wider flex-shrink-0', getMethodBadgeClass(activeMethod))}
            data-label={`${testId}-method-badge`}
          >
            {activeMethod}
          </span>
        ) : (
          <div className="flex items-center gap-1 flex-shrink-0" data-label={`${testId}-method-pills`} role="group" aria-label="Select HTTP method">
            {methods.map((m) => {
              const isActive = m === activeMethod
              return (
                <button
                  key={m}
                  onClick={() => onMethodChange?.(m)}
                  className={cn(
                    'text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-wider transition-all duration-150',
                    isActive
                      ? getMethodBadgeClass(m)
                      : getMethodMutedClass(m)
                  )}
                  data-label={`${testId}-method-pill-${m}`}
                  data-method={m}
                  data-active={isActive}
                  aria-pressed={isActive}
                  title={`Switch to ${m}`}
                >
                  {m}
                </button>
              )
            })}
          </div>
        )}

        <h1
          className="font-mono text-[13px] font-semibold text-on-surface flex-1 truncate"
          data-label={`${testId}-route-path`}
          title={route.path}
        >
          {route.path}
        </h1>

        {/* Execute & Profile button — lives here in the header */}
        <button
          className={cn(
            'flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded text-xs font-bold tracking-wider transition-all',
            'bg-[#2e7d32] hover:bg-[#388e3c] text-white border border-[#1b5e20]',
            'shadow-[0_0_10px_rgba(46,125,50,0.3)] hover:shadow-[0_0_15px_rgba(46,125,50,0.5)]',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          onClick={onRun}
          disabled={loading}
          data-label={`${testId}-execute-btn`}
          data-loading={loading}
        >
          <Play className="w-4 h-4 fill-white" />
          {loading ? 'Running…' : 'Execute & Profile'}
        </button>
      </div>

      {/* Description */}
      <p
        className="text-[12px] text-on-surface-variant leading-snug"
        data-label={`${testId}-description`}
      >
        {route.description || 'Profiles the selected endpoint, capturing SQL queries, response time, and N+1 patterns.'}
      </p>
    </div>
  )
}