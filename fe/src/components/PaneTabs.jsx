// src/components/PaneTabs.jsx
export function PaneTabs({
  tabs = [],
  activeId,
  onChange,
  testId = 'pane-tabs',
}) {
  return (
    <div className="flex items-center gap-1 border-b border-outline-variant bg-surface-container-low px-2 pt-1 overflow-x-auto no-scrollbar" data-label={testId}>
      {tabs.map((tab) => {
        const isActive = activeId === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange?.(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-label-caps text-xs transition-colors rounded-t border-t border-x ${
              isActive
                ? 'bg-surface text-primary border-outline-variant font-bold border-b-transparent -mb-px'
                : 'text-on-surface-variant border-transparent hover:text-on-surface hover:bg-surface-container-high/40'
            }`}
            role="tab"
            aria-selected={isActive}
          >
            {tab.icon && <span className="material-symbols-outlined text-[14px]">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-primary/20 text-primary font-mono">
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
