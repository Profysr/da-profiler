// components/dashboard/RouteList.jsx
import { useMemo } from 'react'
import { List } from 'react-window'
import { AutoSizer } from 'react-virtualized-auto-sizer'
import { cn } from '../../utils/classNames.js'
import { MethodBadge } from '../ui/Badge.jsx'

const ITEM_HEIGHT = 96

/**
 * Route list item component matching the design
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
function RouteItem({ route, isSelected, isExecutable, onClick, index }) {
  const methods = route.methods || ['GET']
  const primaryMethod = methods[0]

  // Determine method badge style based on HTTP method
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

  const baseClasses = cn(
    'p-3 rounded border transition-colors cursor-pointer group',
    'relative overflow-hidden',
    isSelected ? 'card-active' : 'bg-surface border-outline-variant hover:bg-surface-container-high',
    !isExecutable && 'opacity-50'
  )

  return (
    <div
      onClick={() => onClick(route, index)}
      className={baseClasses}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(route, index)
        }
      }}
      aria-selected={isSelected}
      aria-disabled={!isExecutable}
      title={!isExecutable ? route.reason_unexecutable || 'Not executable' : undefined}
    >
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l" />
      )}

      <div className="flex items-center gap-2 mb-2 pl-2">
        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', getMethodBadgeClass(primaryMethod))}>
          {primaryMethod}
        </span>
        <span className={cn('font-code-sm text-code-sm truncate', isSelected ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface transition-colors')}>
          {route.path}
        </span>
      </div>

      <div className="flex justify-between items-center pl-2 text-on-surface-variant font-body-sm text-[10px]">
        <span>Last run: {route.last_run || '2m ago'}</span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px]">speed</span> {route.duration_ms || '45ms'}
        </span>
      </div>

      {!isSelected && (
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}
    </div>
  )
}

/**
 * Virtualized route list component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function RouteList({ routes, selectedRoute, onSelect }) {
  const selectedIndex = useMemo(() =>
    routes.findIndex((r) => r.path === selectedRoute?.path && r.name === selectedRoute?.name),
    [routes, selectedRoute]
  )

  const ItemRenderer = ({ index, style }) => {
    const route = routes[index]
    const isSelected = index === selectedIndex
    const isExecutable = route.executable

    return (
      <div style={style}>
        <RouteItem
          route={route}
          isSelected={isSelected}
          isExecutable={isExecutable}
          onClick={onSelect}
          index={index}
        />
      </div>
    )
  }

  return (
    <AutoSizer disableHeight>
      {({ width }) => (
        <List
          height={600}
          itemCount={routes.length}
          itemSize={ITEM_HEIGHT}
          width={width}
          itemData={routes}
          overscanCount={5}
        >
          {ItemRenderer}
        </List>
      )}
    </AutoSizer>
  )
}