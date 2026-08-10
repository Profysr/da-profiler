import { useState } from 'react';

export function RouteFilterChips({ filters = ['All', 'Executable', 'Requires Params'], defaultActive = 'All', onFilterChange, "data-label": testId = "route-filter-chips" }) {
  const [active, setActive] = useState(defaultActive);

  const handleSelect = (filter) => {
    setActive(filter);
    if (onFilterChange) onFilterChange(filter);
  };

  return (
    <div className="flex gap-2 flex-wrap" data-label={testId}>
      {filters.map((filter) => {
        const isActive = active === filter;
        return (
          <span
            key={filter}
            onClick={() => handleSelect(filter)}
            className={`rounded-full px-2 py-0.5 font-label-caps text-label-caps cursor-pointer transition-colors border ${isActive
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-surface-variant text-on-surface border-outline-variant hover:bg-surface-bright'
              }`}
            data-label={`${testId}-chip-${filter.toLowerCase().replace(/\s+/g, '-')}`}
            data-filter={filter}
            data-active={isActive}
          >
            {filter}
          </span>
        );
      })}
    </div>
  );
}