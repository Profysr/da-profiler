// components/dashboard/RouteList.jsx
import { useMemo } from 'react'
import { List } from 'react-window'
import { AutoSizer } from 'react-virtualized-auto-sizer'
import { cn } from '../../utils/classNames.js'
import { MethodBadge } from '../ui/Badge.jsx'

const ITEM_HEIGHT = 72

/**
 * Route list item component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
function RouteItem({ route, isSelected, isExecutable, onClick, index }) {
  const methods = route.methods || ['GET']
  
  return (
    <div
      onClick={() => onClick(route, index)}
      className={cn(
        'route-card p-3 rounded-md cursor-pointer transition-all duration-fast',
        'border border-transparent',
        'hover:bg-bg-tertiary',
        isSelected && 'bg-bg-tertiary border-border',
        !isExecutable && 'opacity-50'
      )}
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
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="font-mono text-sm text-text-primary truncate">
            {route.path}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {methods.slice(0, 3).map((method) => (
            <MethodBadge key={method} method={method} />
          ))}
          {methods.length > 3 && (
            <span className="text-xs text-text-secondary px-1.5 py-0.5">
              +{methods.length - 3}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {route.path_params && route.path_params.length > 0 && (
          <span className={cn('badge-gray flex items-center gap-1')}>
            <span className="text-text-secondary">⬡</span>
            {route.path_params.length} param{route.path_params.length > 1 ? 's' : ''}
          </span>
        )}
        {route.target_model && (
          <span className={cn('badge-gray truncate max-w-[150px]')}>
            {route.target_model}
          </span>
        )}
        {route.view_type && (
          <span className={cn('badge-gray')}>
            {route.view_type}
          </span>
        )}
        {!isExecutable && (
          <span className="badge-red">
            Not executable
          </span>
        )}
      </div>
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
          height={600} // Will be constrained by parent
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