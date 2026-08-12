import { useState, useRef, useCallback, useEffect } from 'react'
import { Header } from './Header.jsx'
import { Sidebar } from './Sidebar.jsx'
import { UrlBar } from './UrlBar.jsx'
import { RequestWorkbench } from './RequestWorkbench.jsx'
import { ResponseWorkbench } from './ResponseWorkbench.jsx'
import { useRoutesStore } from '../store/routesStore.js'
import { useProfileStore } from '../store/profileStore.js'
import { useConnectionsStore } from '../store/connectionsStore.js'
import { useRequestStore } from '../store/requestStore.js'
import { useUiStore } from '../store/uiStore.js'
import { useToast } from './ui/toast.jsx'

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
  const { toast } = useToast()
  const { fetchTargets, selectedTarget, selectTarget } = useRoutesStore()
  const { profileTarget, loading: profiling, result: profileResult } = useProfileStore()
  const { activeConnectionId } = useConnectionsStore()
  const { pathParams, queryParams } = useRequestStore()

  const [method, setMethod] = useState('GET')
  const [basePathPattern] = useState('/api/v1/books/')

  const {
    activeSidebarNav,
    activeRequestTab,
    activeResponseTab,
    topHeight,
    setActiveSidebarNav,
    setActiveRequestTab,
    setActiveResponseTab,
    setTopHeight,
  } = useUiStore()

  const isResizingRef = useRef(false)
  const dragStartYRef = useRef(0)
  const dragStartHeightRef = useRef(0)
  const topRef = useRef(null)

  useEffect(() => {
    fetchTargets()
  }, [fetchTargets, activeConnectionId])

  // ================================================
  // ── Seed path params from selected target ───────
  // ================================================
  const { setPathParams } = useRequestStore()

  useEffect(() => {
    if (!selectedTarget) return

    const urlParams = selectedTarget.target_details?.url_params ?? []

    // Build one row per path segment. The converter tells the user what type of value is expected (e.g. 'int' → must be a number, 'slug' → slug string).
    const seeded = urlParams.map(({ name, converter }) => ({
      enabled: true,
      key: name,
      value: '',
      description: converter ?? 'str',
    }))

    setPathParams(seeded)
  }, [selectedTarget, setPathParams])

  // Derive effective method & base path from selectedTarget or local state
  const effectiveMethod = selectedTarget?.target_details?.methods?.[0] || method
  const effectiveBasePath = selectedTarget?.target_details?.path || selectedTarget?.name || basePathPattern

  const handleSend = async () => {
    if (!selectedTarget) return

    // All path params are required — the backend cannot resolve the URL without them.
    // Block execution and surface the missing fields to the user.
    const missingParams = pathParams.filter((p) => p.enabled && p.value.trim() === '')
    if (missingParams.length > 0) {
      const names = missingParams.map((p) => p.key).join(', ')
      toast.error('Missing Path Parameters', `Required path param${missingParams.length > 1 ? 's' : ''} missing: ${names}`)
      return
    }

    const { headers, bodyContent, bodyType } = useRequestStore.getState()

    // Validate JSON body if JSON body type is active
    let parsedBody = null
    if (bodyType === 'json' && bodyContent && bodyContent.trim() !== '') {
      try {
        parsedBody = JSON.parse(bodyContent)
      } catch (err) {
        toast.error('Invalid JSON Body', err.message || 'Syntax error in JSON request body')
        return
      }
    }

    // profileStore expects plain objects, not the row-array format the UI uses internally.
    //   path_params:  {id: 42, no: 3}          ← positional path segments
    //   query_params: {page: '1', size: '10'}  ← query string key=value pairs
    const path_params = Object.fromEntries(
      pathParams
        .filter((p) => p.enabled && p.key.trim() !== '')
        .map((p) => [p.key.trim(), p.value])
    )
    const query_params = Object.fromEntries(
      queryParams
        .filter((q) => q.enabled && q.key.trim() !== '')
        .map((q) => [q.key.trim(), q.value])
    )

    try {
      await profileTarget(selectedTarget, {
        method: effectiveMethod,
        path: effectiveBasePath,
        path_params,
        query_params,
        headers,
        body: parsedBody,
      })
    } catch (err) {
      toast.error('Request Failed', err.message || 'Failed to execute profile target')
    }
  }

  // ================================================
  // ── Resize SplitPane ────────────────────────────
  // ================================================
  const handleResizeMouseDown = useCallback((e) => {
    e.preventDefault()
    isResizingRef.current = true
    dragStartYRef.current = e.clientY
    dragStartHeightRef.current = topRef.current?.offsetHeight ?? 300
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = (e) => {
      if (!isResizingRef.current) return
      const containerHeight = topRef.current?.parentElement?.offsetHeight ?? 600
      const delta = e.clientY - dragStartYRef.current
      // Ensure top pane height leaves at least 120px for the response pane at the bottom
      const maxTopHeight = Math.max(120, containerHeight - 120)
      const newHeight = Math.min(maxTopHeight, Math.max(120, dragStartHeightRef.current + delta))
      setTopHeight(newHeight)
    }

    const onMouseUp = () => {
      isResizingRef.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [setTopHeight])

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
              path={effectiveBasePath}
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
                activeTabId={activeRequestTab}
                onTabChange={setActiveRequestTab}
                data-label={`${testId}-request-pane`}
              />
            </div>

            <PaneResizer onResize={handleResizeMouseDown} />

            <div
              className={`flex flex-col bg-surface-container-low overflow-hidden relative min-h-30 ${topHeight !== null ? 'flex-1' : 'flex-1 h-1/2'
                }`}
              data-label={`${testId}-response`}
            >
              <ResponseWorkbench
                activeTabId={activeResponseTab}
                onTabChange={setActiveResponseTab}
                profileResult={profileResult}
                loading={profiling}
                metrics={{
                  status: profileResult?.error
                    ? `${profileResult.status_code || 500} Internal Error`
                    : profileResult?.status_code
                      ? `${profileResult.status_code} OK`
                      : '200 OK',
                  time: profileResult?.metrics?.db_time_ms !== undefined
                    ? `${profileResult.metrics.db_time_ms} ms`
                    : '—',
                  size: profileResult?.response_size !== undefined && profileResult?.response_size !== null
                    ? `${profileResult.response_size} B`
                    : '—',
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