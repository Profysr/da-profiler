// components/workbench/Workbench.jsx
import { useState, useRef, useCallback } from 'react'
import { GlobalHeader } from './GlobalHeader.jsx'
import { SidebarNavigator } from './SidebarNavigator.jsx'
import { UrlBar } from './UrlBar.jsx'
import { DjangoRibbon } from './DjangoRibbon.jsx'
import { RequestWorkbench } from './RequestWorkbench.jsx'
import { ResponseWorkbench } from './ResponseWorkbench.jsx'

function PaneResizer({ onResize }) {
  return (
    <div
      onMouseDown={onResize}
      className="h-1 bg-outline-variant cursor-row-resize hover:bg-primary transition-colors shrink-0 z-20"
      data-label="workbench-pane-resizer"
      role="separator"
      aria-orientation="horizontal"
    />
  )
}

export function Workbench({
  "data-label": testId = 'workbench',
}) {
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('workspaces')
  const [activeSidebarNav, setActiveSidebarNav] = useState('collections')
  const [method, setMethod] = useState('GET')
  const [path, setPath] = useState('/api/v1/books/')
  const [requestTab, setRequestTab] = useState('params')
  const [responseTab, setResponseTab] = useState('n1-warnings')

  const [topHeight, setTopHeight] = useState(null)
  const isResizingRef = useRef(false)
  const dragStartYRef = useRef(0)
  const dragStartHeightRef = useRef(0)
  const topRef = useRef(null)

  const handleResizeMouseDown = useCallback((e) => {
    e.preventDefault()
    isResizingRef.current = true
    dragStartYRef.current = e.clientY
    dragStartHeightRef.current = topRef.current?.offsetHeight ?? 300
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = (e) => {
      if (!isResizingRef.current) return
      const delta = dragStartYRef.current - e.clientY
      const newHeight = Math.max(120, dragStartHeightRef.current + delta)
      setTopHeight(newHeight)
    }

    const onMouseUp = () => {
      isResizingRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [])

  const topStyle = topHeight !== null ? { height: `${topHeight}px` } : undefined
  const topClass = topHeight !== null ? 'shrink-0' : 'flex-1 h-1/2'

  return (
    <div
      className="bg-background text-on-background h-screen w-screen overflow-hidden flex flex-col font-body-md text-body-md"
      data-label={testId}
    >
      <GlobalHeader
        activeTabId={activeWorkspaceTab}
        onTabChange={setActiveWorkspaceTab}
        data-label={`${testId}-header`}
      />

      <div className="flex flex-1 overflow-hidden" data-label={`${testId}-body`}>
        <SidebarNavigator
          activeNavId={activeSidebarNav}
          onNavSelect={setActiveSidebarNav}
          data-label={`${testId}-sidebar`}
        />

        <main
          className="flex-1 flex flex-col bg-background h-full overflow-hidden relative"
          data-label={`${testId}-main`}
        >
          <div
            className="bg-surface p-container-padding border-b border-outline-variant flex flex-col gap-tight-gap shrink-0 z-10 relative"
            data-label={`${testId}-url-section`}
          >
            <UrlBar
              method={method}
              onMethodChange={setMethod}
              path={path}
              onPathChange={setPath}
              data-label={`${testId}-url-bar`}
            />
            <DjangoRibbon data-label={`${testId}-ribbon`} />
          </div>

          <div className="flex flex-col flex-1 overflow-hidden relative" data-label={`${testId}-panes`}>
            <div ref={topRef} className={`flex flex-col border-b border-outline-variant bg-background overflow-hidden ${topClass}`} style={topStyle} data-label={`${testId}-request`}>
              <RequestWorkbench
                activeTabId={requestTab}
                onTabChange={setRequestTab}
                data-label={`${testId}-request-pane`}
              />
            </div>

            <PaneResizer onResize={handleResizeMouseDown} />

            <div className={`flex flex-col bg-background overflow-hidden relative ${topHeight !== null ? 'flex-1' : 'flex-1 h-1/2'}`} data-label={`${testId}-response`}>
              <ResponseWorkbench
                activeTabId={responseTab}
                onTabChange={setResponseTab}
                data-label={`${testId}-response-pane`}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
