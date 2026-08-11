// src/components/Workbench.jsx
import { useState, useRef, useCallback, useEffect } from 'react'
import { Header } from './Header.jsx'
import { Sidebar } from './Sidebar.jsx'
import { UrlBar } from './UrlBar.jsx'
import { RequestWorkbench } from './RequestWorkbench.jsx'
import { ResponseWorkbench } from './ResponseWorkbench.jsx'
import { useRoutesStore } from '../store/routesStore.js'
import { useProfileStore } from '../store/profileStore.js'
import { useConnectionsStore } from '../store/connectionsStore.js'

function PaneResizer({ onResize }) {
  return (
    <div
      onMouseDown={onResize}
      className="h-1 bg-outline-variant cursor-row-resize hover:bg-primary transition-colors shrink-0 z-20"
      role="separator"
      aria-orientation="horizontal"
    />
  )
}

export function Workbench({
  "data-label": testId = 'workbench',
}) {
  const { fetchTargets, selectedTarget, selectTarget } = useRoutesStore()
  const { profileTarget, runProfile, loading: profiling, result: profileResult } = useProfileStore()
  const { activeConnectionId } = useConnectionsStore()

  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('workspaces')
  const [activeSidebarNav, setActiveSidebarNav] = useState('collections')
  const [method, setMethod] = useState('GET')
  const [path, setPath] = useState('/api/v1/books/')
  
  // Request Tab state
  const [requestTab, setRequestTab] = useState('params')
  const [params, setParams] = useState([
    { enabled: true, key: 'page', value: '1', description: 'Page number' },
    { enabled: true, key: 'page_size', value: '10', description: 'Page size' },
  ])
  const [headers, setHeaders] = useState([
    { enabled: true, key: 'Accept', value: 'application/json', description: 'Accept payload format' },
    { enabled: true, key: 'Content-Type', value: 'application/json', description: 'Content format' },
  ])
  const [bodyType, setBodyType] = useState('json')
  const [bodyContent, setBodyContent] = useState('{\n  "title": "New Book",\n  "author_id": 1\n}')

  // Response Tab state
  const [responseTab, setResponseTab] = useState('response')

  // Split pane sizing
  const [topHeight, setTopHeight] = useState(null)
  const isResizingRef = useRef(false)
  const dragStartYRef = useRef(0)
  const dragStartHeightRef = useRef(0)
  const topRef = useRef(null)

  // Fetch targets on initial load & connection changes
  useEffect(() => {
    fetchTargets()
  }, [fetchTargets, activeConnectionId])

  // Sync selected target into URL bar & method
  useEffect(() => {
    if (selectedTarget) {
      const methods = selectedTarget.trigger_spec?.methods || ['GET']
      setMethod(methods[0] || 'GET')
      setPath(selectedTarget.trigger_spec?.path || selectedTarget.name || '/api/v1/books/')
    }
  }, [selectedTarget])

  // Dynamic Query String sync with URL Path
  const updatePathWithParams = (newParams) => {
    setParams(newParams)
    const basePath = path.split('?')[0]
    const activeQueryParams = newParams.filter((p) => p.enabled && p.key.trim() !== '')
    if (activeQueryParams.length === 0) {
      setPath(basePath)
    } else {
      const queryString = activeQueryParams
        .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
        .join('&')
      setPath(`${basePath}?${queryString}`)
    }
  }

  const handleSend = async () => {
    if (selectedTarget) {
      profileTarget(selectedTarget, { method, path, params, headers, bodyContent })
    } else {
      runProfile(path, method, { params, headers, bodyContent })
    }
  }

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
      {/* Active Single Header */}
      <Header
        activeTabId={activeWorkspaceTab}
        onTabChange={setActiveWorkspaceTab}
        data-label={`${testId}-header`}
      />

      <div className="flex flex-1 overflow-hidden" data-label={`${testId}-body`}>
        {/* Active Single Sidebar */}
        <Sidebar
          activeNavId={activeSidebarNav}
          onNavSelect={setActiveSidebarNav}
          selectedTarget={selectedTarget}
          onSelectTarget={selectTarget}
          data-label={`${testId}-sidebar`}
        />

        <main
          className="flex-1 flex flex-col bg-background h-full overflow-hidden relative"
          data-label={`${testId}-main`}
        >
          {/* Postman URL Bar section */}
          <div
            className="bg-surface p-container-padding border-b border-outline-variant shrink-0 z-10 relative"
            data-label={`${testId}-url-section`}
          >
            <UrlBar
              method={method}
              onMethodChange={setMethod}
              path={path}
              onPathChange={setPath}
              onSend={handleSend}
              loading={profiling}
              data-label={`${testId}-url-bar`}
            />
          </div>

          {/* Request / Response Split Panes */}
          <div className="flex flex-col flex-1 overflow-hidden relative" data-label={`${testId}-panes`}>
            <div
              ref={topRef}
              className={`flex flex-col border-b border-outline-variant bg-background overflow-hidden ${topClass}`}
              style={topStyle}
              data-label={`${testId}-request`}
            >
              <RequestWorkbench
                activeTabId={requestTab}
                onTabChange={setRequestTab}
                params={params}
                onParamsChange={updatePathWithParams}
                headers={headers}
                onHeadersChange={setHeaders}
                bodyType={bodyType}
                onBodyTypeChange={setBodyType}
                bodyContent={bodyContent}
                onBodyContentChange={setBodyContent}
                data-label={`${testId}-request-pane`}
              />
            </div>

            <PaneResizer onResize={handleResizeMouseDown} />

            <div
              className={`flex flex-col bg-background overflow-hidden relative ${
                topHeight !== null ? 'flex-1' : 'flex-1 h-1/2'
              }`}
              data-label={`${testId}-response`}
            >
              <ResponseWorkbench
                activeTabId={responseTab}
                onTabChange={setResponseTab}
                profileResult={profileResult}
                loading={profiling}
                metrics={{
                  status: profileResult ? '200 OK' : '200 OK',
                  time: profileResult ? '14.2 ms' : '14.2 ms',
                  size: profileResult ? '1.2 KB' : '1.2 KB',
                }}
                data-label={`${testId}-response-pane`}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
