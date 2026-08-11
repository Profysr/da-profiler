// components/workbench/DjangoRibbon.jsx
import { DJANGO_RIBBON } from './data.js'

function RibbonItem({ label, icon, value }) {
  return (
    <>
      <div className="flex items-center gap-2" data-label={`django-ribbon-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        <span className="font-label-caps text-label-caps text-outline-variant">{label}</span>
        <div className="flex items-center bg-surface border border-outline-variant rounded px-2 py-1 gap-1">
          <span className="material-symbols-outlined text-[14px] text-primary">{icon}</span>
          <span className="font-code-sm text-code-sm text-on-surface">{value}</span>
          {label === 'AUTH MODE' && (
            <span className="material-symbols-outlined text-[14px] text-outline-variant">arrow_drop_down</span>
          )}
        </div>
      </div>
      <div className="w-px h-4 bg-outline-variant" data-label={`django-ribbon-divider-${label.toLowerCase().replace(/\s+/g, '-')}`} />
    </>
  )
}

function SandboxToggle({ enabled, onChange, label }) {
  return (
    <div className="flex items-center gap-2" data-label={`django-ribbon-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <span className="font-label-caps text-label-caps text-outline-variant">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange?.(e.target.checked)}
          className="sr-only peer"
          data-label={`django-ribbon-${label.toLowerCase().replace(/\s+/g, '-')}-toggle`}
          aria-label={label}
        />
        <div
          className={[
            'w-9 h-5 rounded-full peer-focus:outline-none transition-colors',
            'after:content-[""] after:absolute after:top-[2px] after:left-[2px]',
            'after:bg-white after:border after:border-gray-300 after:rounded-full',
            'after:h-4 after:w-4 after:transition-all',
            'peer-checked:after:translate-x-full peer-checked:after:border-white',
            enabled ? 'bg-tertiary-container' : 'bg-surface-variant',
          ].join(' ')}
        />
      </label>
    </div>
  )
}

export function DjangoRibbon({
  config = DJANGO_RIBBON,
  onSandboxToggle,
  "data-label": testId = 'django-ribbon',
}) {
  return (
    <div
      className="flex items-center gap-4 mt-2 px-1 bg-surface-container-lowest p-2 rounded border border-outline-variant"
      data-label={testId}
    >
      <RibbonItem
        label={config.actAsUser.label}
        icon={config.actAsUser.icon}
        value={config.actAsUser.value}
      />
      <RibbonItem
        label={config.authMode.label}
        icon={config.authMode.icon}
        value={config.authMode.value}
      />
      <SandboxToggle
        enabled={config.sandboxMode.enabled}
        onChange={onSandboxToggle}
        label={config.sandboxMode.label}
      />
    </div>
  )
}
