// components/workbench/PaneTabs.jsx
export function PaneTabs({
  tabs,
  activeId,
  onChange,
  testId = 'pane-tabs',
}) {
  return (
    <div
      className="flex items-center border-b border-outline-variant bg-surface px-2 shrink-0"
      role="tablist"
      data-label={testId}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId
        const isError = tab.variant === 'error'
        const className = [
          'px-4 py-2 font-label-caps text-label-caps border-b-2 transition-colors flex items-center gap-2',
          active
            ? isError
              ? 'text-primary border-primary bg-surface font-bold'
              : 'text-primary border-primary bg-surface font-bold'
            : 'text-on-surface-variant border-transparent hover:text-on-surface',
        ].join(' ')

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange?.(tab.id)}
            role="tab"
            aria-selected={active}
            data-label={`${testId}-tab-${tab.id}`}
            data-tab-id={tab.id}
            data-active={active}
            data-variant={tab.variant || 'default'}
            className={className}
          >
            {tab.icon && (
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            )}
            <span>{tab.label}</span>
            {typeof tab.badge === 'number' && tab.badge > 0 && (
              <span
                className="bg-error text-on-error rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold"
                data-label={`${testId}-badge-${tab.id}`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
