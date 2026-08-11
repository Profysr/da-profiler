// src/components/ResponseMetrics.jsx
export function ResponseMetrics({
  status = '200 OK',
  time = '14.2 ms',
  size = '1.2 KB',
  testId = 'response-metrics',
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-surface border-b border-outline-variant text-xs select-none" data-label={testId}>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-label-caps uppercase text-on-surface-variant">Status:</span>
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          {status}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-label-caps uppercase text-on-surface-variant">Time:</span>
        <span className="font-mono text-primary font-bold">{time}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-label-caps uppercase text-on-surface-variant">Size:</span>
        <span className="font-mono text-on-surface font-semibold">{size}</span>
      </div>
    </div>
  )
}
