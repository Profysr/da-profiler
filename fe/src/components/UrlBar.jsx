// src/components/UrlBar.jsx
import { MethodSelector } from './MethodSelector.jsx'
import { useConnectionsStore } from '../store/connectionsStore.js'

export function UrlBar({
  method = 'GET',
  onMethodChange,
  path = '/api/v1/books/',
  onPathChange,
  onSend,
  loading = false,
  "data-label": testId = 'url-bar',
}) {
  const { getActiveConnection } = useConnectionsStore()
  const activeConnection = getActiveConnection()
  const baseUrl = activeConnection?.baseUrl || 'http://127.0.0.1:8000'

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      onSend?.()
    }
  }

  return (
    <div className="flex items-center gap-2" data-label={testId}>
      <MethodSelector
        value={method}
        onChange={onMethodChange}
        data-label={`${testId}-method`}
      />

      <div
        className="flex-1 relative flex items-center bg-surface border border-outline-variant rounded focus-within:border-primary transition-colors h-10 overflow-hidden shadow-inner"
        data-label={`${testId}-field-wrapper`}
      >
        <span
          className="pl-3 font-mono text-xs text-on-surface-variant/80 border-r border-outline-variant pr-2.5 select-none bg-surface-container-low shrink-0 h-full flex items-center"
          title="Active Django Server Base URL"
        >
          {baseUrl}
        </span>
        <input
          type="text"
          value={path}
          onChange={(e) => onPathChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="/api/v1/resource/"
          className="w-full bg-transparent border-none text-on-surface font-mono text-xs px-3 py-2 focus:outline-none placeholder:text-surface-variant"
          aria-label="Request path"
        />
      </div>

      <button
        type="button"
        onClick={onSend}
        disabled={loading}
        className="bg-primary text-on-primary h-10 px-6 rounded font-label-caps text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2 shrink-0 disabled:opacity-60 shadow-md active:scale-95"
        title="Send Request (Ctrl + Enter)"
      >
        {loading ? (
          <>
            <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
            <span>Sending...</span>
          </>
        ) : (
          <>
            <span>Send</span>
            <span className="material-symbols-outlined text-[16px]">send</span>
          </>
        )}
      </button>
    </div>
  )
}
