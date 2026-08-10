import { Search } from 'lucide-react';

export function GlobalSearch({ placeholder = "Search...", className = "", "data-label": testId = "global-search" }) {
  return (
    <div className={`flex items-center bg-surface-container border border-outline-variant rounded px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary shadow-sm ${className}`} data-label={testId}>
      <Search className="w-4 h-4 text-on-surface-variant mr-2 flex-shrink-0" />
      <input
        className="bg-transparent border-none outline-none text-body-sm font-body-sm text-on-surface placeholder:text-on-surface-variant w-full p-0 focus:ring-0"
        placeholder={placeholder}
        type="text"
        data-label={`${testId}-input`}
      />
    </div>
  );
}