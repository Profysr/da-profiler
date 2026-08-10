// components/profiler/ProfilerHeader.jsx
import { cn } from '../../utils/classNames.js'

/**
 * Profiler header component showing selected route info - matches design
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function ProfilerHeader({ route, "data-label": testId = "profiler-header" }) {
  if (!route) return null

  const methods = route.methods || ['GET']
  const primaryMethod = methods[0]

  const getMethodBadgeClass = (method) => {
    switch (method) {
      case 'GET': return 'method-get'
      case 'POST': return 'method-post'
      case 'PUT':
      case 'PATCH': return 'method-put'
      case 'DELETE': return 'method-delete'
      default: return 'method-badge badge-gray'
    }
  }

  return (
    <div className="p-4 md:p-lg max-w-container-max mx-auto w-full flex flex-col gap-sm border-b border-outline-variant pb-md flex-shrink-0" data-label={testId} data-route-path={route.path} data-route-method={primaryMethod}>
      <div className="flex items-center gap-3" data-label={`${testId}-method-path`}>
        <span className={cn('text-[14px] font-bold px-2 py-1 rounded', getMethodBadgeClass(primaryMethod))} data-label={`${testId}-method-badge`}>
          {primaryMethod}
        </span>
        <h1 className="font-headline-sm md:font-headline-lg text-headline-sm md:text-headline-lg text-on-surface font-code-md tracking-tight break-all" data-label={`${testId}-route-path`}>
          {route.path}
        </h1>
      </div>
      <p className="font-body-sm md:font-body-md text-body-sm md:text-body-md text-on-surface-variant" data-label={`${testId}-description`}>
        {route.description || 'Profiles the user indexing endpoint, fetching related roles and permissions.'}
      </p>
    </div>
  )
}