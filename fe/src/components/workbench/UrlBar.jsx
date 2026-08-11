// components/workbench/UrlBar.jsx
import { MethodSelector } from './MethodSelector.jsx'

export function UrlBar({
  method,
  onMethodChange,
  baseUrl = '{{base_url}}',
  path = '/api/v1/books/',
  onPathChange,
  onSend,
  loading = false,
  "data-label": testId = 'url-bar',
}) {
  return (
    <div className="flex items-center gap-tight-gap" data-label={testId}>
      <MethodSelector
        value={method}
        onChange={onMethodChange}
        data-label={`${testId}-method`}
      />

      <div
        className="flex-1 relative flex items-center bg-background border border-outline-variant rounded focus-within:border-primary transition-colors h-10"
        data-label={`${testId}-field-wrapper`}
      >
        <span
          className="pl-3 font-code-md text-code-md text-on-surface-variant border-r border-outline-variant pr-2 mr-2 py-2 select-none"
          data-label={`${testId}-base-url`}
        >
          {baseUrl}
        </span>
        <input
          type="text"
          value={path}
          onChange={(e) => onPathChange?.(e.target.value)}
          className="w-full bg-transparent border-none text-on-surface font-code-md text-code-md py-2 pr-3 focus:outline-none placeholder:text-surface-variant"
          data-label={`${testId}-path`}
          aria-label="Request path"
        />
      </div>

      <button
        type="button"
        onClick={onSend}
        disabled={loading}
        className="bg-primary text-on-primary h-10 px-6 rounded font-label-caps text-label-caps font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shrink-0 disabled:opacity-60"
        data-label={`${testId}-send`}
      >
        <span>Send</span>
        <span className="material-symbols-outlined text-[16px]">send</span>
      </button>
    </div>
  )
}
