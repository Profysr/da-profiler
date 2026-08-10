import { Bug, Database, AlertTriangle, FileCode, List, Activity, Circle } from 'lucide-react';

const ICON_MAP = {
  bug_report: Bug,
  bug: Bug,
  data_object: Database,
  database: Database,
  warning: AlertTriangle,
  raw_on: FileCode,
  list_alt: List,
  timeline: Activity,
};

export function TabBar({ tabs, activeTabId, onTabChange, "data-label": testId = "tab-bar" }) {
  return (
    <div className="flex border-b border-outline-variant bg-surface-container-low px-2 md:px-sm overflow-x-auto hide-scrollbar" data-label={testId}>
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;
        const isErrorTab = tab.variant === 'error';
        const IconComponent = typeof tab.icon === 'string' ? (ICON_MAP[tab.icon] || Circle) : tab.icon;

        let btnClasses = "px-3 md:px-4 py-3 border-b-2 font-label-caps text-label-caps flex items-center gap-2 whitespace-nowrap transition-colors font-medium text-xs ";

        if (isActive) {
          btnClasses += isErrorTab
            ? "border-error text-error bg-error-container/10 font-bold"
            : "border-primary text-primary bg-primary/10 font-bold";
        } else {
          btnClasses += "border-transparent text-on-surface-variant hover:text-on-surface";
        }

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={btnClasses}
            data-label={`${testId}-tab-${tab.id}`}
            data-tab-id={tab.id}
            data-active={isActive}
            data-variant={tab.variant || 'default'}
            role="tab"
            aria-selected={isActive}
          >
            {IconComponent && <IconComponent className="w-4 h-4" />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ children, isActive, "data-label": testId = "tab-panel" }) {
  if (!isActive) return null;

  return (
    <div className="p-4 md:p-md bg-surface flex-1 flex flex-col gap-4 md:gap-md overflow-y-auto" data-label={testId} data-active={isActive} role="tabpanel">
      {children}
    </div>
  );
}