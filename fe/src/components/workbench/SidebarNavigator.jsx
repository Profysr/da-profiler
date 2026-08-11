// components/workbench/SidebarNavigator.jsx
import { useState } from 'react'
import {
  SIDEBAR_NAV_ITEMS,
  SIDEBAR_PROJECT_FOLDERS,
  SIDEBAR_FOOTER_ICONS,
} from './data.js'

function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative w-full" data-label="sidebar-search-input">
      <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant pointer-events-none">
        search
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-background border border-outline-variant rounded py-1 pl-8 pr-2 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition-colors"
        data-label="sidebar-search-field"
      />
    </div>
  )
}

function SidebarNavItem({ item, isActive, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(item.id)}
      className={[
        'flex items-center gap-2 p-2 rounded transition-colors w-full text-left',
        isActive
          ? 'bg-surface text-primary border-l-2 border-primary'
          : 'text-on-surface-variant hover:bg-surface-container-highest',
      ].join(' ')}
      data-label={`sidebar-nav-${item.id}`}
      data-nav-id={item.id}
      data-active={isActive}
      aria-pressed={isActive}
    >
      <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
      <span className="font-body-sm text-body-sm font-semibold">{item.label}</span>
    </button>
  )
}

function ProjectFolder({ folder, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(folder.id)}
      className="flex items-center gap-2 p-1.5 rounded hover:bg-surface-container-highest transition-colors text-on-surface w-full text-left"
      data-label={`sidebar-folder-${folder.id}`}
      data-folder-id={folder.id}
    >
      <span className="material-symbols-outlined text-[16px] text-outline">{folder.icon}</span>
      <span className="font-body-sm text-body-sm">{folder.label}</span>
    </button>
  )
}

function FooterIcon({ icon, title }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className="p-2 rounded hover:bg-surface-container-highest text-on-surface-variant transition-colors flex flex-col items-center gap-1"
      data-label={`sidebar-footer-${icon}`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
    </button>
  )
}

export function SidebarNavigator({
  organizationName = 'Django Core',
  environmentName = 'Local Environment',
  organizationLogoUrl,
  activeNavId = 'collections',
  onNavSelect,
  onFolderSelect,
  onCreateRequest,
  searchPlaceholder = 'Search...',
  "data-label": testId = 'sidebar-navigator',
}) {
  const [search, setSearch] = useState('')

  return (
    <aside
      className="flex flex-col h-full z-40 bg-surface-container-low border-r border-outline-variant shrink-0"
      style={{ width: 'var(--spacing-sidebar-width)' }}
      data-label={testId}
      aria-label="Sidebar navigation"
    >
      <div className="p-4 border-b border-outline-variant flex items-center gap-3" data-label={`${testId}-header`}>
        <div
          className="w-8 h-8 rounded bg-surface-container-highest border border-outline-variant overflow-hidden shrink-0"
          data-label={`${testId}-logo`}
        >
          {organizationLogoUrl ? (
            <img alt="Organization Logo" className="w-full h-full object-cover" src={organizationLogoUrl} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px]">deployed_code</span>
            </div>
          )}
        </div>
        <div className="flex flex-col min-w-0" data-label={`${testId}-meta`}>
          <span className="font-headline-sm text-headline-sm text-on-surface font-bold leading-tight truncate">
            {organizationName}
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant leading-tight truncate">
            {environmentName}
          </span>
        </div>
      </div>

      <div className="p-2 border-b border-outline-variant" data-label={`${testId}-search`}>
        <SearchInput value={search} onChange={setSearch} placeholder={searchPlaceholder} />
      </div>

      <nav
        className="flex-1 overflow-y-auto p-2 flex flex-col gap-1"
        data-label={`${testId}-nav`}
        role="navigation"
      >
        {SIDEBAR_NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            isActive={activeNavId === item.id}
            onSelect={onNavSelect}
          />
        ))}

        <div className="mt-4 mb-1 px-2" data-label={`${testId}-project-label`}>
          <span className="font-label-caps text-label-caps text-on-surface-variant">Project</span>
        </div>

        <div
          className="pl-4 border-l border-outline-variant ml-3 flex flex-col gap-1"
          data-label={`${testId}-folders`}
        >
          {SIDEBAR_PROJECT_FOLDERS.map((folder) => (
            <ProjectFolder key={folder.id} folder={folder} onSelect={onFolderSelect} />
          ))}
        </div>
      </nav>

      <div
        className="p-4 border-t border-outline-variant flex flex-col gap-2"
        data-label={`${testId}-footer`}
      >
        <button
          type="button"
          onClick={onCreateRequest}
          className="w-full py-2 bg-surface-container-highest text-on-surface rounded font-label-caps text-label-caps font-bold flex items-center justify-center gap-2 hover:bg-surface-variant transition-colors border border-outline-variant"
          data-label={`${testId}-new-request`}
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          New Request
        </button>

        <div className="flex justify-around mt-2" data-label={`${testId}-footer-icons`}>
          {SIDEBAR_FOOTER_ICONS.map((btn) => (
            <FooterIcon key={btn.id} icon={btn.icon} title={btn.title} />
          ))}
        </div>
      </div>
    </aside>
  )
}
