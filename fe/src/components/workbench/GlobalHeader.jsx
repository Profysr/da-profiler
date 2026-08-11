// components/workbench/GlobalHeader.jsx
import { WORKSPACE_TABS, HEADER_ICON_BUTTONS } from './data.js'

function NavTab({ tab, isActive, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(tab.id)}
      className={[
        'flex items-center h-full px-2 border-b-2 transition-colors',
        'font-label-caps text-label-caps',
        isActive
          ? 'text-primary border-primary font-bold hover:bg-surface-container-high'
          : 'text-on-surface-variant border-transparent font-body-md text-body-md hover:bg-surface-container-high',
      ].join(' ')}
      data-label={`global-header-tab-${tab.id}`}
      data-tab-id={tab.id}
      data-active={isActive}
      role="tab"
      aria-selected={isActive}
    >
      {tab.label}
    </button>
  )
}

function IconButton({ icon, title }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className="p-1 text-on-surface-variant hover:bg-surface-container-high transition-colors"
      data-label={`global-header-icon-${icon}`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
    </button>
  )
}

export function GlobalHeader({
  brand = 'API Workbench',
  activeTabId,
  onTabChange,
  userAvatarUrl,
  "data-label": testId = 'global-header',
}) {
  return (
    <header
      className="bg-surface border-b border-outline-variant flex justify-between items-center w-full px-container-padding h-header-height shrink-0 z-50"
      data-label={testId}
    >
      <div className="flex items-center gap-4" data-label={`${testId}-left`}>
        <span className="font-headline-sm text-headline-sm font-bold text-primary" data-label={`${testId}-brand`}>
          {brand}
        </span>

        <nav className="flex gap-4 h-full ml-4" data-label={`${testId}-nav`} role="tablist">
          {WORKSPACE_TABS.map((tab) => (
            <NavTab
              key={tab.id}
              tab={tab}
              isActive={activeTabId === tab.id}
              onSelect={onTabChange}
            />
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-element-gap" data-label={`${testId}-right`}>
        <div className="flex items-center gap-1 border-l border-outline-variant pl-2 ml-2" data-label={`${testId}-icon-buttons`}>
          {HEADER_ICON_BUTTONS.map((btn) => (
            <IconButton key={btn.id} icon={btn.icon} title={btn.title} />
          ))}
        </div>

        <div
          className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant ml-2 shrink-0 bg-surface-container-high"
          data-label={`${testId}-avatar`}
          aria-label="User profile"
        >
          {userAvatarUrl ? (
            <img alt="User profile" className="w-full h-full object-cover" src={userAvatarUrl} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
