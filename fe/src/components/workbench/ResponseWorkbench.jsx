// components/workbench/ResponseWorkbench.jsx
import { PaneTabs } from './PaneTabs.jsx'
import { ResponseMetrics } from './ResponseMetrics.jsx'
import { QueryWarningPanel } from './QueryWarningPanel.jsx'
import { RESPONSE_PANE_TABS } from './data.js'

export function ResponseWorkbench({
  tabs = RESPONSE_PANE_TABS,
  activeTabId = 'n1-warnings',
  onTabChange,
  metrics,
  "data-label": testId = 'response-workbench',
}) {
  return (
    <section
      className="flex-1 flex flex-col bg-background overflow-hidden relative"
      data-label={testId}
    >
      <ResponseMetrics {...metrics} testId={`${testId}-metrics`} />

      <PaneTabs
        tabs={tabs}
        activeId={activeTabId}
        onChange={onTabChange}
        testId={`${testId}-tabs`}
      />

      <div
        className="flex-1 p-4 overflow-y-auto bg-surface-container-lowest"
        data-label={`${testId}-content`}
      >
        {activeTabId === 'n1-warnings' && <QueryWarningPanel />}
      </div>
    </section>
  )
}
