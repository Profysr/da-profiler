// components/workbench/RequestWorkbench.jsx
import { PaneTabs } from './PaneTabs.jsx'
import { REQUEST_PANE_TABS } from './data.js'

export function RequestWorkbench({
  tabs = REQUEST_PANE_TABS,
  activeTabId = 'params',
  onTabChange,
  emptyMessage = 'Select a tab to view request details',
  children,
  "data-label": testId = 'request-workbench',
}) {
  return (
    <section
      className="flex-1 flex flex-col border-b border-outline-variant bg-background overflow-hidden"
      data-label={testId}
    >
      <PaneTabs
        tabs={tabs}
        activeId={activeTabId}
        onChange={onTabChange}
        testId={`${testId}-tabs`}
      />

      <div className="flex-1 p-4 overflow-y-auto" data-label={`${testId}-content`}>
        {children ?? (
          <div className="w-full flex items-center justify-center h-full" data-label={`${testId}-empty`}>
            <span className="text-on-surface-variant font-code-md text-code-md">{emptyMessage}</span>
          </div>
        )}
      </div>
    </section>
  )
}
