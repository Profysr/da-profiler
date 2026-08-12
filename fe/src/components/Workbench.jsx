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
      className="h-1.5 bg-outline-variant cursor-row-resize hover:bg-primary transition-colors shrink-0 z-20"
      role="separator"
      aria-orientation="horizontal"
    />
  )
}

export function Workbench({
  "data-label": testId = 'workbench',
}) {
  const { fetchTargets, selectedTarget, selectTarget } = useRoutesStore()
  const { profileTarget, loading: profiling, result: profileResult } = useProfileStore()
  const { activeConnectionId } = useConnectionsStore()

  const [activeSidebarNav, setActiveSidebarNav] = useState('collections')
  const [method, setMethod] = useState('GET')
  const [basePathPattern, setBasePathPattern] = useState('/api/v1/books/')
  const [computedUrl, setComputedUrl] = useState('/api/v1/books/')
  const [sidebarWidth, setSidebarWidth] = useState(280)

  // Separate Path Params & Query Params state
  const [requestTab, setRequestTab] = useState('queryParams')
  const [pathParams, setPathParams] = useState([
    { enabled: true, key: 'id', value: '1', description: 'Resource ID' },
  ])
  const [queryParams, setQueryParams] = useState([
    { enabled: true, key: 'page', value: '1', description: 'Page number' },
    { enabled: true, key: 'page_size', value: '10', description: 'Page size' },
  ])
  const [headers, setHeaders] = useState([
    { enabled: true, key: 'Accept', value: 'application/json', description: 'Accept format' },
    { enabled: true, key: 'Content-Type', value: 'application/json', description: 'Content format' },
  ])
  const [bodyType, setBodyType] = useState('json')
  const [bodyContent, setBodyContent] = useState('{\n  "title": "New Book",\n  "author_id": 1\n}')
  const [formData, setFormData] = useState([
    { enabled: true, key: 'title', value: 'New Book', type: 'text', description: 'Book title' },
    { enabled: true, key: 'author_id', value: '1', type: 'text', description: 'Author foreign key' },
    { enabled: false, key: 'cover_image', value: '', type: 'file', file: null, description: 'Cover image upload' },
  ])
  const [urlencodedData, setUrlencodedData] = useState([
    { enabled: true, key: 'format', value: 'json', description: 'Response format' },
  ])

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

  // Sync selected target into URL bar pattern
  useEffect(() => {
    if (selectedTarget) {
const methods = selectedTarget.target_details?.methods || ['GET']
setMethod(methods[0] || 'GET')
const targetPath = selectedTarget.target_details?.path || selectedTarget.name || '/api/v1/books/'
      setBasePathPattern(targetPath)
    }
  }, [selectedTarget])

  // Dynamic URL construction: pathParams + queryParams -> computed static URL
  useEffect(() => {
    let rawPath = basePathPattern.split('?')[0]

    // Substitute path params (e.g. :id or {id})
    pathParams.forEach((p) => {
      if (p.enabled && p.key.trim() !== '') {
        const paramKey = p.key.trim()
        rawPath = rawPath.replace(`:${paramKey}`, encodeURIComponent(p.value))
        rawPath = rawPath.replace(`{${paramKey}}`, encodeURIComponent(p.value))
      }
    })

    // Append active query parameters
    const activeQueries = queryParams.filter((q) => q.enabled && q.key.trim() !== '')
    if (activeQueries.length > 0) {
      const queryString = activeQueries
        .map((q) => `${encodeURIComponent(q.key)}=${encodeURIComponent(q.value)}`)
        .join('&')
      setComputedUrl(`${rawPath}?${queryString}`)
    } else {
      setComputedUrl(rawPath)
    }
  }, [basePathPattern, pathParams, queryParams])

  const handleSend = async () => {
    if (selectedTarget) {
      await profileTarget(selectedTarget, { method, path: computedUrl, params: queryParams, headers, bodyContent })
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
      className="bg-background text-on-background h-screen w-screen overflow-hidden flex flex-col font-sans text-xs"
      data-label={testId}
    >
      {/* Clean Header */}
      <Header data-label={`${testId}-header`} />

      <div className="flex flex-1 overflow-hidden" data-label={`${testId}-body`}>
        {/* Resizable Sidebar */}
        <Sidebar
          activeNavId={activeSidebarNav}
          onNavSelect={setActiveSidebarNav}
          selectedTarget={selectedTarget}
          onSelectTarget={selectTarget}
          width={sidebarWidth}
          onWidthChange={setSidebarWidth}
          data-label={`${testId}-sidebar`}
        />

        <main
          className="flex-1 flex flex-col bg-background h-full overflow-hidden relative"
          data-label={`${testId}-main`}
        >
          {/* Static Readonly URL Bar */}
          <div
            className="bg-surface-container p-3 border-b border-outline-variant shrink-0 z-10 relative"
            data-label={`${testId}-url-section`}
          >
            <UrlBar
              method={method}
              onMethodChange={setMethod}
              path={computedUrl}
              onSend={handleSend}
              loading={profiling}
              data-label={`${testId}-url-bar`}
            />
          </div>

          {/* Request / Response Split Panes */}
          <div className="flex flex-col flex-1 overflow-hidden relative" data-label={`${testId}-panes`}>
            <div
              ref={topRef}
              className={`flex flex-col border-b border-outline-variant bg-surface-container-low overflow-hidden ${topClass}`}
              style={topStyle}
              data-label={`${testId}-request`}
            >
              <RequestWorkbench
                activeTabId={requestTab}
                onTabChange={setRequestTab}
                pathParams={pathParams}
                onPathParamsChange={setPathParams}
                queryParams={queryParams}
                onQueryParamsChange={setQueryParams}
                headers={headers}
                onHeadersChange={setHeaders}
                bodyType={bodyType}
                onBodyTypeChange={setBodyType}
                bodyContent={bodyContent}
                onBodyContentChange={setBodyContent}
                formData={formData}
                onFormDataChange={setFormData}
                urlencodedData={urlencodedData}
                onUrlencodedDataChange={setUrlencodedData}
                data-label={`${testId}-request-pane`}
              />
            </div>

            <PaneResizer onResize={handleResizeMouseDown} />

            <div
              className={`flex flex-col bg-surface-container-low overflow-hidden relative ${
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
                  status: '200 OK',
                  time: '14.2 ms',
                  size: '1.2 KB',
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
