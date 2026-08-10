// components/profiler/ProfilerHeader.jsx
import { cn } from '../../utils/classNames.js'
import { Play } from 'lucide-react'

/**
 * Profiler header component showing selected route info - matches design
 * Includes the Execute & Profile action button in the header row (Postman style)
 */
export function ProfilerHeader({ route, onRun, loading = false, "data-label": testId = "profiler-header" }) {
  if (!route) return null

  const methods = route.methods || [route.method || 'GET']
  const primaryMethod = methods[0]

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

  return (
    <div
      className="px-4 py-3 border-b border-outline-variant flex-shrink-0 flex flex-col gap-2"
      data-label={testId}
      data-route-path={route.path}
      data-route-method={primaryMethod}
    >
      {/* Top row: method badge + path + execute button */}
      <div className="flex items-center gap-3 flex-wrap" data-label={`${testId}-method-path`}>
        <span
          className={cn('text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-wider flex-shrink-0', getMethodBadgeClass(primaryMethod))}
          data-label={`${testId}-method-badge`}
        >
          {primaryMethod}
        </span>

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