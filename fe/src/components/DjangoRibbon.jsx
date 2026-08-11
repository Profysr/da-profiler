// src/components/DjangoRibbon.jsx
import { Icon } from './Icon.jsx'

export function DjangoRibbon({ "data-label": testId = 'django-ribbon' }) {
  return (
    <div className="flex items-center gap-3 text-xs text-on-surface-variant bg-surface-container-low px-2 py-1 rounded border border-outline-variant/60 select-none" data-label={testId}>
      <div className="flex items-center gap-1">
        <Icon name="person" size={14} className="text-primary" />
        <span className="font-semibold text-on-surface text-[11px]">User: Admin (ID: 1)</span>
      </div>
      <div className="h-3 w-px bg-outline-variant" />
      <div className="flex items-center gap-1">
        <Icon name="key" size={14} className="text-emerald-400" />
        <span className="text-[11px]">Session / Bearer</span>
      </div>
      <div className="h-3 w-px bg-outline-variant" />
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] font-medium text-emerald-400">Sandbox Mode</span>
      </div>
    </div>
  )
}
