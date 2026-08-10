import { AlertTriangle, Gauge, Lock, Database, Cpu, Zap, Bell, Globe } from 'lucide-react';
import { TARGET_KINDS } from '../../utils/constants.js';

const KIND_ICONS = {
  view: Globe,
  task: Cpu,
  consumer: Zap,
  signal: Bell,
};

const methodStyles = {
  GET: "bg-[#1e4620] text-[#a5d6a7] border-[#2e7d32]",
  POST: "bg-surface-variant text-secondary border-outline-variant",
  PUT: "bg-[#4a148c] text-[#ce93d8] border-[#7b1fa2]",
  DELETE: "bg-error-container text-error border-error",
  TASK: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  WS: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  SIGNAL: "bg-green-500/20 text-green-400 border-green-500/30",
};

export function RouteCard({ 
  method, 
  path, 
  lastRun, 
  time, 
  params, 
  hasN1, 
  isActive, 
  kind = 'view',
  triggerable = true,
  onClick, 
  "data-label": testId, 
  "data-target-id": targetId, 
  "data-target-kind": targetKind 
}) {
  const kindConfig = TARGET_KINDS[kind] || TARGET_KINDS.view;
  const KindIcon = KIND_ICONS[kind] || Globe;
  
  const activeWrapperStyles = "border-primary bg-primary/5 shadow-glow-primary";
  const inactiveWrapperStyles = "border-outline-variant bg-surface hover:bg-surface-container-high";
  const disabledStyles = "opacity-50 cursor-not-allowed";

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border cursor-pointer transition-all relative group ${isActive ? activeWrapperStyles : inactiveWrapperStyles} ${!triggerable ? disabledStyles : ''}`}
      data-label={testId || `target-card-${targetId}`}
      data-target-id={targetId}
      data-target-kind={targetKind || kind}
      data-active={isActive}
      data-has-n1={hasN1}
      data-triggerable={triggerable}
    >
      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-lg" data-label="active-indicator" />}

      <div className={`flex items-center gap-2 mb-2 ${isActive ? 'pl-2' : ''}`}>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${methodStyles[method] || methodStyles.GET}`} data-label="method-badge">
          {method}
        </span>
        <KindIcon className={`w-3.5 h-3.5 ${kindConfig.color} flex-shrink-0`} aria-hidden="true" />
        <span className={`font-code-sm text-code-sm truncate transition-colors ${isActive ? 'text-primary font-semibold' : 'text-on-surface-variant group-hover:text-on-surface'}`} data-label="target-path">
          {path}
        </span>
      </div>

      <div className={`flex justify-between items-center ${isActive ? 'pl-2' : 'text-on-surface-variant font-body-sm text-[10px]'}`}>
        {isActive ? (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-variant text-on-surface-variant border border-outline-variant" data-label="params-count">
            {params} params
          </span>
        ) : (
          <span data-label="last-run" className="text-[11px] text-on-surface-variant">Last run: {lastRun}</span>
        )}

        <div className="flex items-center gap-1.5">
          {hasN1 ? (
            <span className="flex items-center gap-1 text-error font-body-sm text-[10px] font-semibold" data-label="n1-badge">
              <AlertTriangle className="w-3 h-3 text-error" /> N+1 Detected
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-on-surface-variant" data-label="latency">
              <Gauge className="w-3 h-3 text-on-surface-variant" /> {time}
            </span>
          )}

          {!triggerable && (
            <span className="flex items-center gap-1 text-[10px] text-warning font-semibold" data-label="static-only-badge" title="Static analysis only - not executable">
              <Lock className="w-3 h-3" /> Static Only
            </span>
          )}
        </div>
      </div>
    </div>
  );
}