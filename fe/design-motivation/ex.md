Here is the requested extraction of the Layout & Core Structure along with the UI Primitives from the provided HTML file, converted into reusable and interactive React components.

### 1. UI Primitives

These are the modular, reusable pieces extracted from the static HTML to eliminate duplication and introduce state where necessary.

**`components/ui/GlobalSearch.jsx`**
This component extracts the search input used in both the TopNavBar and SideNavBar.

```jsx
import React from 'react';

export function GlobalSearch({ placeholder = "Search...", className = "" }) {
  return (
    <div className={`flex items-center bg-surface-container border border-outline-variant rounded px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary shadow-sm ${className}`}>
      <span className="material-symbols-outlined text-on-surface-variant text-[18px] mr-2">search</span>
      <input
        className="bg-transparent border-none outline-none text-body-sm font-body-sm text-on-surface placeholder:text-on-surface-variant w-full p-0 focus:ring-0"
        placeholder={placeholder}
        type="text"
      />
    </div>
  );
}

```

**`components/ui/RouteFilterChips.jsx`**
Extracted the hardcoded filter spans into a stateful, map-based component.

```jsx
import React, { useState } from 'react';

export function RouteFilterChips({ filters = ['All', 'Executable', 'Requires Params'], defaultActive = 'All', onFilterChange }) {
  const [active, setActive] = useState(defaultActive);

  const handleSelect = (filter) => {
    setActive(filter);
    if (onFilterChange) onFilterChange(filter);
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map((filter) => {
        const isActive = active === filter;
        return (
          <span
            key={filter}
            onClick={() => handleSelect(filter)}
            className={`rounded-full px-2 py-0.5 font-label-caps text-label-caps cursor-pointer transition-colors border ${
              isActive
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-surface-variant text-on-surface border-outline-variant hover:bg-surface-bright'
            }`}
          >
            {filter}
          </span>
        );
      })}
    </div>
  );
}

```

**`components/ui/RouteCard.jsx`**
Refactored the repetitive sidebar route elements into a single, prop-driven component.

```jsx
import React from 'react';

export function RouteCard({ method, path, lastRun, time, params, hasN1, isActive, onClick }) {
  // Semantic method colors mapped from the HTML
  const methodStyles = {
    GET: "bg-[#1e4620] text-[#a5d6a7] border-[#2e7d32]",
    POST: "bg-surface-variant text-secondary border-outline-variant",
    PUT: "bg-[#4a148c] text-[#ce93d8] border-[#7b1fa2]"
  };

  const activeWrapperStyles = "border-primary bg-primary/5 shadow-[0_0_8px_rgba(162,201,255,0.15)]";
  const inactiveWrapperStyles = "border-outline-variant bg-surface hover:bg-surface-container-high";

  return (
    <div 
      onClick={onClick}
      className={`p-3 rounded border cursor-pointer transition-colors relative group ${isActive ? activeWrapperStyles : inactiveWrapperStyles}`}
    >
      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l"></div>}
      
      <div className={`flex items-center gap-2 mb-2 ${isActive ? 'pl-2' : ''}`}>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${methodStyles[method] || methodStyles.GET}`}>
          {method}
        </span>
        <span className={`font-code-sm text-code-sm truncate transition-colors ${isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'}`}>
          {path}
        </span>
      </div>
      
      <div className={`flex justify-between items-center ${isActive ? 'pl-2' : 'text-on-surface-variant font-body-sm text-[10px]'}`}>
        {isActive ? (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-variant text-on-surface-variant border border-outline-variant">
            {params} params
          </span>
        ) : (
          <span>Last run: {lastRun}</span>
        )}
        
        {hasN1 ? (
          <span className="flex items-center gap-1 text-on-surface font-body-sm text-[10px]">
            <span className="material-symbols-outlined text-[12px] text-error">warning</span> N+1 Detected
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">speed</span> {time}
          </span>
        )}
      </div>
    </div>
  );
}

```

**`components/ui/MetricCard.jsx`**
Extracted the Bento-grid metric boxes into a unified component.

```jsx
import React from 'react';

export function MetricCard({ title, value, icon, variant = 'default', children }) {
  const variants = {
    default: "bg-surface-container border-outline-variant",
    error: "bg-[#3b0a0a] border-error shadow-[0_0_12px_rgba(147,0,10,0.3)]"
  };

  const textColors = {
    default: "text-on-surface",
    success: "text-[#a5d6a7]",
    error: "text-on-error-container"
  };

  return (
    <div className={`${variants[variant] || variants.default} rounded p-4 md:p-md flex flex-col justify-center gap-2 relative overflow-hidden group`}>
      <span className={`font-label-caps text-label-caps flex items-center gap-1 ${variant === 'error' ? 'text-error' : 'text-on-surface-variant'}`}>
        <span className="material-symbols-outlined text-[14px]">{icon}</span>
        {title}
      </span>
      <div className={`font-headline-md text-headline-md ${textColors[variant] || textColors.default}`}>
        {value}
      </div>
      {children}
    </div>
  );
}

```

### 2. Layout & Core Structure

These components utilize the primitives defined above and manage the overall application shell.

**`components/layout/TopNavBar.jsx`**
Converted static navigation into a mapped array and integrated the `GlobalSearch` UI primitive.

```jsx
import React from 'react';
import { GlobalSearch } from '../ui/GlobalSearch';

const NAV_LINKS = ['Dashboard', 'Analytics', 'Settings'];

export default function TopNavBar() {
  return (
    <header className="bg-surface dark:bg-surface border-b border-outline-variant dark:border-outline-variant fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-lg h-16">
      <div className="flex items-center gap-4 md:gap-xl">
        <button className="lg:hidden text-on-surface p-1 hover:bg-surface-variant rounded transition-colors">
          <span className="material-symbols-outlined">menu</span>
        </button>
        
        <div className="font-headline-md text-headline-md font-bold text-primary dark:text-primary flex items-center gap-2">
          <span className="material-symbols-outlined" data-weight="fill" style={{ fontVariationSettings: '"FILL" 1' }}>bolt</span>
          <span className="hidden sm:inline">Da Profiler</span>
        </div>
        
        <div className="hidden sm:block w-48 md:w-64">
          <GlobalSearch placeholder="Global search..." />
        </div>
      </div>
      
      <nav className="hidden lg:flex items-center h-full gap-md">
        {NAV_LINKS.map(link => (
          <a key={link} className="h-full flex items-center px-2 font-label-caps text-label-caps text-on-surface-variant dark:text-on-surface-variant hover:bg-surface-variant dark:hover:bg-surface-variant transition-colors" href="#">
            {link}
          </a>
        ))}
      </nav>
      
      <div className="flex items-center gap-2 md:gap-4">
        <button className="hidden sm:block bg-primary text-on-primary font-label-caps text-label-caps px-4 py-2 rounded font-bold hover:bg-primary-fixed transition-colors">
          Profile Route
        </button>
        <div className="flex items-center gap-1 md:gap-2 text-on-surface-variant">
          <button className="p-1 hover:text-on-surface transition-colors"><span className="material-symbols-outlined">notifications</span></button>
          <button className="p-1 hover:text-on-surface transition-colors hidden sm:block"><span className="material-symbols-outlined">help</span></button>
          <button className="p-1 hover:text-on-surface transition-colors"><span className="material-symbols-outlined">account_circle</span></button>
        </div>
      </div>
    </header>
  );
}

```

**`components/layout/SideNavBar.jsx`**
Utilizes the `GlobalSearch`, `RouteFilterChips`, and iterates over `RouteCard`s via state.

```jsx
import React, { useState } from 'react';
import { GlobalSearch } from '../ui/GlobalSearch';
import { RouteFilterChips } from '../ui/RouteFilterChips';
import { RouteCard } from '../ui/RouteCard';

const INITIAL_ROUTES = [
  { id: 1, method: 'POST', path: '/api/v1/auth/login', lastRun: '2m ago', time: '45ms', isActive: false },
  { id: 2, method: 'GET', path: '/api/v1/users', params: 2, hasN1: true, isActive: true },
  { id: 3, method: 'PUT', path: '/api/v1/users/{id}', lastRun: '1h ago', time: '120ms', isActive: false },
];

export default function SideNavBar() {
  const [activeRouteId, setActiveRouteId] = useState(2);

  return (
    <aside className="bg-surface-container dark:bg-surface-container border-r border-outline-variant dark:border-outline-variant fixed left-0 top-16 h-[calc(100vh-64px)] w-[320px] hidden lg:flex flex-col z-40 overflow-hidden">
      <div className="px-md py-md border-b border-outline-variant mb-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded bg-surface-variant flex items-center justify-center text-primary border border-outline-variant">
            <span className="material-symbols-outlined">api</span>
          </div>
          <div>
            <div className="font-headline-sm text-headline-sm text-on-surface">Da Profiler</div>
            <div className="font-body-sm text-body-sm text-on-surface-variant">API Intelligence</div>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <GlobalSearch placeholder="Search routes..." className="bg-surface" />
          <RouteFilterChips />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-md py-sm flex flex-col gap-2">
        {INITIAL_ROUTES.map(route => (
          <RouteCard 
            key={route.id} 
            {...route} 
            isActive={activeRouteId === route.id}
            onClick={() => setActiveRouteId(route.id)}
          />
        ))}
      </div>
      
      <div className="px-md py-4 mt-auto border-t border-outline-variant">
        <button className="w-full border border-primary text-primary font-label-caps text-label-caps py-2 rounded hover:bg-primary/10 transition-colors flex justify-center items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[16px]">add</span> New Profile
        </button>
        <div className="flex flex-col gap-1">
          <a className="flex items-center gap-3 px-2 py-1.5 text-on-surface-variant hover:text-on-surface transition-colors font-body-sm text-body-sm" href="#">
            <span className="material-symbols-outlined text-[18px]">description</span> Docs
          </a>
          <a className="flex items-center gap-3 px-2 py-1.5 text-on-surface-variant hover:text-on-surface transition-colors font-body-sm text-body-sm" href="#">
            <span className="material-symbols-outlined text-[18px]">contact_support</span> Support
          </a>
        </div>
      </div>
    </aside>
  );
}

```

**`components/layout/AppShell.jsx`**
The root wrapper that pulls the layout together.

```jsx
import React from 'react';
import TopNavBar from './TopNavBar';
import SideNavBar from './SideNavBar';

export default function AppShell({ children }) {
  return (
    <div className="bg-background text-on-surface h-screen w-screen overflow-hidden flex flex-col font-body-md">
      <TopNavBar />
      <div className="flex flex-1 pt-16 h-full w-full overflow-hidden">
        <SideNavBar />
        <main className="flex-1 lg:ml-[320px] w-full flex h-full overflow-hidden bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}

```

### Checklist

* [x] Layout Structure (AppShell, TopNavBar, SideNavBar)
* [x] UI Primitives (GlobalSearch, RouteFilterChips, RouteCard, MetricCard)

Here are the extracted and refactored Profiler components. They have been converted into interactive, stateful React components while perfectly preserving the original design tokens and layout classes from the provided HTML.

### [x] 1. ProfilerHeader

This component accepts props to dynamically render the HTTP method, endpoint path, and description, removing the hardcoded values.

```jsx
// components/profiler/ProfilerHeader.jsx
import React from 'react';

export default function ProfilerHeader({ 
  method = 'GET', 
  path = '/api/v1/users', 
  description = 'Profiles the user indexing endpoint, fetching related roles and permissions.' 
}) {
  return (
    <div className="flex flex-col gap-sm border-b border-outline-variant pb-md">
      <div className="flex items-center gap-3">
        <span className="text-[14px] font-bold px-2 py-1 rounded bg-[#1e4620] text-[#a5d6a7] border border-[#2e7d32]">
          {method}
        </span>
        <h1 className="font-headline-sm md:font-headline-lg text-headline-sm md:text-headline-lg text-on-surface font-code-md tracking-tight break-all">
          {path}
        </h1>
      </div>
      <p className="font-body-sm md:font-body-md text-body-sm md:text-body-md text-on-surface-variant">
        {description}
      </p>
    </div>
  );
}

```

### [x] 2. ProfilerControls

This component manages its own state for switching between "Path Params" and "Query Params", as well as adding, editing, and deleting parameter rows dynamically.

```jsx
// components/profiler/ProfilerControls.jsx
import React, { useState } from 'react';

export default function ProfilerControls() {
  const [activeParamTab, setActiveParamTab] = useState('path');
  const [params, setParams] = useState([
    { id: 1, key: 'organization_id', value: 'org_9x8b7', desc: 'The unique identifier for the organization' }
  ]);

  const addParam = () => {
    setParams([...params, { id: Date.now(), key: '', value: '', desc: '' }]);
  };

  const removeParam = (id) => {
    setParams(params.filter(p => p.id !== id));
  };

  const updateParam = (id, field, newValue) => {
    setParams(params.map(p => (p.id === id ? { ...p, [field]: newValue } : p)));
  };

  return (
    <div className="bg-surface-container p-4 md:p-md rounded border border-outline-variant flex flex-col md:flex-row md:flex-wrap items-start md:items-end gap-4 md:gap-md shadow-sm">
      <div className="flex flex-col gap-4 w-full flex-1">
        
        {/* Param Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveParamTab('path')}
              className={`font-label-caps text-label-caps pb-1 whitespace-nowrap transition-colors ${activeParamTab === 'path' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Path Params
            </button>
            <button 
              onClick={() => setActiveParamTab('query')}
              className={`font-label-caps text-label-caps pb-1 whitespace-nowrap transition-colors ${activeParamTab === 'query' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Query Params
            </button>
          </div>
        </div>
        
        {/* Param Table */}
        <div className="border border-outline-variant rounded overflow-hidden bg-surface overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-surface-variant/50 border-b border-outline-variant">
                <th className="px-4 py-2 font-label-caps text-label-caps text-on-surface-variant w-1/4">Key</th>
                <th className="px-4 py-2 font-label-caps text-label-caps text-on-surface-variant w-1/4">Value</th>
                <th className="px-4 py-2 font-label-caps text-label-caps text-on-surface-variant w-auto">Description</th>
                <th className="px-4 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="font-code-sm text-code-sm">
              {params.map(param => (
                <tr key={param.id} className="border-b border-outline-variant/50">
                  <td className="px-4 py-2">
                    <input className="bg-transparent border-none outline-none text-primary font-code-sm w-full p-0 focus:ring-0" type="text" value={param.key} onChange={(e) => updateParam(param.id, 'key', e.target.value)} placeholder="Key" />
                  </td>
                  <td className="px-4 py-2">
                    <input className="bg-transparent border-none outline-none text-on-surface font-code-sm w-full p-0 focus:ring-0" type="text" value={param.value} onChange={(e) => updateParam(param.id, 'value', e.target.value)} placeholder="Value" />
                  </td>
                  <td className="px-4 py-2">
                    <input className="bg-transparent border-none outline-none text-on-surface-variant font-code-sm w-full p-0 focus:ring-0" type="text" value={param.desc} onChange={(e) => updateParam(param.id, 'desc', e.target.value)} placeholder="Description" />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => removeParam(param.id)} className="material-symbols-outlined text-on-surface-variant hover:text-error text-[18px]">
                      delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-2 bg-surface-container-low border-t border-outline-variant">
            <button onClick={addParam} className="flex items-center gap-1 text-label-caps font-label-caps text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors">
              <span className="material-symbols-outlined text-[16px]">add</span> Add Param
            </button>
          </div>
        </div>
      </div>
      
      {/* Execute Button */}
      <button className="bg-[#2e7d32] hover:bg-[#388e3c] text-white border border-[#1b5e20] px-6 py-2 rounded font-label-caps text-label-caps flex items-center justify-center gap-2 transition-all shadow-[0_0_10px_rgba(46,125,50,0.3)] hover:shadow-[0_0_15px_rgba(46,125,50,0.5)] w-full md:w-auto">
        <span className="material-symbols-outlined text-[18px]">play_arrow</span>
        Execute &amp; Profile
      </button>
    </div>
  );
}

```

### [x] 3. MetricsGrid

The grid leverages a configuration array to dynamically map out the `MetricCard` components instead of hardcoding all four blocks.

```jsx
// components/profiler/MetricsGrid.jsx
import React from 'react';
import { MetricCard } from '../ui/MetricCard'; // Assuming previously created UI component

export default function MetricsGrid() {
  const metrics = [
    { id: 1, title: 'HTTP Status', value: '200 OK', icon: 'check_circle', variant: 'success' },
    { 
      id: 2, 
      title: 'Total Queries', 
      value: '12', 
      icon: 'database', 
      variant: 'default',
      addon: <div className="absolute bottom-2 right-2 w-12 h-6 border-t-2 border-r-2 border-primary rounded-tr-full opacity-50"></div>
    },
    { 
      id: 3, 
      title: 'DB Time', 
      value: '42ms', 
      icon: 'timer', 
      variant: 'default',
      addon: <div className="w-full bg-surface rounded-full h-1 mt-1"><div className="bg-tertiary h-1 rounded-full w-[15%]"></div></div>
    },
    { id: 4, title: 'N+1 Status', value: 'Detected', icon: 'warning', variant: 'error' }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-md">
      {metrics.map(metric => (
        <MetricCard key={metric.id} title={metric.title} value={metric.value} icon={metric.icon} variant={metric.variant}>
          {metric.addon}
        </MetricCard>
      ))}
    </div>
  );
}

```

### [x] 4. ResultsArea

This component controls the tab logic for the bottom section of the profiler.

```jsx
// components/profiler/ResultsArea.jsx
import React, { useState } from 'react';
import SummaryPanel from './SummaryPanel';

export default function ResultsArea() {
  const [activeTab, setActiveTab] = useState('summary');

  const tabs = [
    { id: 'summary', label: 'Summary', icon: 'bug_report', isAlert: true },
    { id: 'sql', label: 'SQL Queries (12)', icon: 'data_object' },
    { id: 'response', label: 'Raw Response', icon: 'raw_on' },
    { id: 'logs', label: 'Logs', icon: 'list_alt' },
    { id: 'timeline', label: 'Timeline', icon: 'timeline' }
  ];

  return (
    <div className="flex flex-col flex-1 border border-outline-variant rounded bg-surface-container overflow-hidden min-h-[300px]">
      
      {/* Tab Bar */}
      <div className="flex border-b border-outline-variant bg-surface-container-low px-2 md:px-sm overflow-x-auto hide-scrollbar">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const alertClasses = tab.isAlert && isActive ? 'border-error text-error bg-error-container/10' : '';
          const standardClasses = !tab.isAlert && isActive ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface';
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 md:px-4 py-3 border-b-2 font-label-caps text-label-caps flex items-center gap-2 transition-colors whitespace-nowrap ${isActive && tab.isAlert ? alertClasses : standardClasses}`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>
      
      {/* Tab Panels */}
      <div className="p-4 md:p-md bg-surface flex-1 flex flex-col gap-4 md:gap-md overflow-y-auto">
        {activeTab === 'summary' && <SummaryPanel />}
        {activeTab === 'sql' && <div className="text-on-surface">SQL Queries Panel Content...</div>}
        {activeTab === 'response' && <div className="text-on-surface">Raw Response Panel Content...</div>}
        {activeTab === 'logs' && <div className="text-on-surface">Logs Panel Content...</div>}
        {activeTab === 'timeline' && <div className="text-on-surface">Timeline Panel Content...</div>}
      </div>
    </div>
  );
}

```

### [x] 5. SummaryPanel

Extracted cleanly as a presentational component displaying the N+1 warning details.

```jsx
// components/profiler/SummaryPanel.jsx
import React from 'react';

export default function SummaryPanel() {
  return (
    <div className="bg-error-container/10 border border-error/50 rounded p-3 md:p-4 flex flex-col md:flex-row gap-3 items-start">
      <span className="material-symbols-outlined text-error mt-0.5 hidden md:block">error</span>
      <div className="flex flex-col gap-2 w-full">
        
        <div className="flex items-center gap-2 md:hidden">
          <span className="material-symbols-outlined text-error">error</span>
          <h3 className="font-body-md text-body-md font-bold text-on-error-container">Redundant Query Loop Detected</h3>
        </div>
        
        <h3 className="font-body-md text-body-md font-bold text-on-error-container hidden md:block">
          Redundant Query Loop Detected
        </h3>
        
        <p className="font-code-sm text-code-sm text-on-surface-variant bg-surface-dim p-2 rounded border border-outline-variant overflow-x-auto">
          Loop in <span className="text-primary font-code-sm">UserSerializer:14</span> triggers 10 redundant queries to <span className="text-tertiary font-code-sm">'roles'</span> table.
        </p>
        
        <div className="mt-2 flex flex-col gap-1 border-l-2 border-outline-variant pl-3 overflow-x-auto">
          <div className="font-code-sm text-[10px] text-on-surface-variant">Trace:</div>
          <div className="font-code-sm text-code-sm text-on-surface opacity-80 whitespace-nowrap">
            app/serializers/user_serializer.rb:14 in `roles`
          </div>
          <div className="font-code-sm text-code-sm text-on-surface opacity-60 whitespace-nowrap">
            app/controllers/api/v1/users_controller.rb:8 in `index`
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-error/20 flex flex-wrap gap-3">
          <button className="text-error text-label-caps font-label-caps hover:underline">View SQL Fragments</button>
          <button className="text-primary text-label-caps font-label-caps hover:underline">Generate Fix Snippet</button>
        </div>
        
      </div>
    </div>
  );
}

```

Here are the missing components, extracted directly from the provided design and converted into reusable, interactive React components.

### [x] 1. Reusable Table Component (`components/ui/Table.jsx`)

To make the table truly reusable for both parameters and future SQL queries, it is split into a generic `<Table/>` wrapper and a specific implementation for the parameters (`<ParamTable/>`). This maintains the exact styling from the design while allowing dynamic data rendering.

```jsx
// components/ui/Table.jsx
import React from 'react';

export function Table({ columns, children, footerAction }) {
  return (
    <div className="border border-outline-variant rounded overflow-hidden bg-surface overflow-x-auto w-full">
      <table className="w-full text-left border-collapse min-w-[500px]">
        <thead>
          <tr className="bg-surface-variant/50 border-b border-outline-variant">
            {columns.map((col, index) => (
              <th 
                key={index} 
                className={`px-4 py-2 font-label-caps text-label-caps text-on-surface-variant ${col.className || ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="font-code-sm text-code-sm">
          {children}
        </tbody>
      </table>
      
      {footerAction && (
        <div className="p-2 bg-surface-container-low border-t border-outline-variant">
          {footerAction}
        </div>
      )}
    </div>
  );
}

// Example Implementation: ParamTable
export function ParamTable({ params, onUpdate, onDelete, onAdd }) {
  const columns = [
    { label: 'Key', className: 'w-1/4' },
    { label: 'Value', className: 'w-1/4' },
    { label: 'Description', className: 'w-auto' },
    { label: '', className: 'w-10' }
  ];

  const AddButton = (
    <button 
      onClick={onAdd}
      className="flex items-center gap-1 text-label-caps font-label-caps text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors"
    >
      <span className="material-symbols-outlined text-[16px]">add</span> Add Param
    </button>
  );

  return (
    <Table columns={columns} footerAction={AddButton}>
      {params.map((param) => (
        <tr key={param.id} className="border-b border-outline-variant/50">
          <td className="px-4 py-2">
            <input 
              className="bg-transparent border-none outline-none text-primary font-code-sm w-full p-0 focus:ring-0" 
              type="text" 
              value={param.key} 
              onChange={(e) => onUpdate(param.id, 'key', e.target.value)} 
            />
          </td>
          <td className="px-4 py-2">
            <input 
              className="bg-transparent border-none outline-none text-on-surface font-code-sm w-full p-0 focus:ring-0" 
              type="text" 
              value={param.value} 
              onChange={(e) => onUpdate(param.id, 'value', e.target.value)} 
            />
          </td>
          <td className="px-4 py-2">
            <input 
              className="bg-transparent border-none outline-none text-on-surface-variant font-code-sm w-full p-0 focus:ring-0" 
              type="text" 
              value={param.desc} 
              onChange={(e) => onUpdate(param.id, 'desc', e.target.value)} 
            />
          </td>
          <td className="px-4 py-2 text-right">
            <button 
              onClick={() => onDelete(param.id)}
              className="material-symbols-outlined text-on-surface-variant hover:text-error text-[18px]"
            >
              delete
            </button>
          </td>
        </tr>
      ))}
    </Table>
  );
}

```

### [x] 2. TabBar / TabPanel System (`components/ui/Tabs.jsx`)

The tab system is abstracted to handle dynamic arrays of tab objects. It accurately reproduces the active/inactive states and the specific error-styling for alert tabs.

```jsx
// components/ui/Tabs.jsx
import React from 'react';

export function TabBar({ tabs, activeTabId, onTabChange }) {
  return (
    <div className="flex border-b border-outline-variant bg-surface-container-low px-2 md:px-sm overflow-x-auto hide-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;
        const isErrorTab = tab.variant === 'error';
        
        // Base classes from the design
        let btnClasses = "px-3 md:px-4 py-3 border-b-2 font-label-caps text-label-caps flex items-center gap-2 whitespace-nowrap transition-colors ";
        
        if (isActive) {
          btnClasses += isErrorTab 
            ? "border-error text-error bg-error-container/10" 
            : "border-primary text-primary bg-primary/10";
        } else {
          btnClasses += "border-transparent text-on-surface-variant hover:text-on-surface";
        }

        return (
          <button 
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={btnClasses}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ children, isActive }) {
  if (!isActive) return null;
  
  return (
    <div className="p-4 md:p-md bg-surface flex-1 flex flex-col gap-4 md:gap-md overflow-y-auto">
      {children}
    </div>
  );
}

```

### [x] 3. N1AlertCard (`components/profiler/N1AlertCard.jsx`)

This component extracts the hardcoded N+1 alert from the Summary Panel into a configurable card that accepts props for the loop location, target table, and stack trace array.

```jsx
// components/profiler/N1AlertCard.jsx
import React from 'react';

export function N1AlertCard({ 
  title = "Redundant Query Loop Detected", 
  loopLocation = "UserSerializer:14", 
  queryCount = 10,
  targetTable = "'roles'",
  traces = [],
  onViewSql,
  onGenerateFix
}) {
  return (
    <div className="bg-error-container/10 border border-error/50 rounded p-3 md:p-4 flex flex-col md:flex-row gap-3 items-start">
      <span className="material-symbols-outlined text-error mt-0.5 hidden md:block">error</span>
      
      <div className="flex flex-col gap-2 w-full">
        {/* Mobile Title */}
        <div className="flex items-center gap-2 md:hidden">
          <span className="material-symbols-outlined text-error">error</span>
          <h3 className="font-body-md text-body-md font-bold text-on-error-container">{title}</h3>
        </div>
        
        {/* Desktop Title */}
        <h3 className="font-body-md text-body-md font-bold text-on-error-container hidden md:block">{title}</h3>
        
        <p className="font-code-sm text-code-sm text-on-surface-variant bg-surface-dim p-2 rounded border border-outline-variant overflow-x-auto">
          Loop in <span className="text-primary font-code-sm">{loopLocation}</span> triggers {queryCount} redundant queries to <span className="text-tertiary font-code-sm">{targetTable}</span> table.
        </p>
        
        {traces.length > 0 && (
          <div className="mt-2 flex flex-col gap-1 border-l-2 border-outline-variant pl-3 overflow-x-auto">
            <div className="font-code-sm text-[10px] text-on-surface-variant">Trace:</div>
            {traces.map((trace, index) => (
              <div 
                key={index} 
                className={`font-code-sm text-code-sm text-on-surface whitespace-nowrap ${index === 0 ? 'opacity-80' : 'opacity-60'}`}
              >
                {trace}
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 pt-3 border-t border-error/20 flex flex-wrap gap-3">
          <button 
            onClick={onViewSql}
            className="text-error text-label-caps font-label-caps hover:underline"
          >
            View SQL Fragments
          </button>
          <button 
            onClick={onGenerateFix}
            className="text-primary text-label-caps font-label-caps hover:underline"
          >
            Generate Fix Snippet
          </button>
        </div>
      </div>
    </div>
  );
}

```

Here are the complete, modular React components for **QueriesTab**, **ResponseTab**, and the **SqlHighlighter** integration to fully bring the Da Profiler interface to life.

---

### 1. `components/profiler/QueriesTab.jsx` (SQLQueriesPanel)

This component maps through the SQL execution array, integrating the `SqlHighlighter` component for syntax highlighting and managing highlighted states for N+1 queries.

```jsx
// components/profiler/QueriesTab.jsx
import { SqlHighlighter } from '../ui/SqlHighlighter.jsx'
import { cn } from '../../utils/classNames.js'

/**
 * SQL Queries Tab Panel component
 * @param {Object} props - Component props
 * @param {Array} props.queries - List of executed SQL query objects
 * @returns {JSX.Element}
 */
export function QueriesTab({ queries = [] }) {
  return (
    <div className="p-4 md:p-md bg-surface flex-1 flex flex-col gap-4 md:gap-md overflow-y-auto">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-surface-variant/50 border-b border-outline-variant">
              <th className="px-4 py-3 font-label-caps text-label-caps text-on-surface-variant w-12">
                #
              </th>
              <th className="px-4 py-3 font-label-caps text-label-caps text-on-surface-variant w-24">
                Time (ms)
              </th>
              <th className="px-4 py-3 font-label-caps text-label-caps text-on-surface-variant w-20">
                Rows
              </th>
              <th className="px-4 py-3 font-label-caps text-label-caps text-on-surface-variant">
                Statement
              </th>
            </tr>
          </thead>
          <tbody className="font-code-sm text-code-sm">
            {queries.map((q, index) => {
              const isNPlusOne = q.isNPlusOne || q.tag === 'N+1 Origin'
              return (
                <tr
                  key={q.id || index}
                  className={cn(
                    'border-b border-outline-variant/30 hover:bg-surface-variant/20 transition-colors',
                    isNPlusOne && 'bg-error-container/5'
                  )}
                >
                  <td className="px-4 py-3 text-on-surface-variant">{index + 1}</td>
                  <td
                    className={cn(
                      'px-4 py-3',
                      q.timeMs > 10 ? 'text-error' : 'text-on-surface'
                    )}
                  >
                    {q.timeMs}ms
                  </td>
                  <td className="px-4 py-3 text-on-surface">{q.rows}</td>
                  <td className="px-4 py-3 flex items-center justify-between gap-2">
                    <SqlHighlighter
                      sql={q.statement}
                      dialect={q.dialect || 'postgres'}
                      theme="dark"
                      maxHeight="120px"
                      className="w-full bg-transparent"
                    />
                    {isNPlusOne && (
                      <span className="text-secondary opacity-60 text-xs whitespace-nowrap">
                        -- N+1 Origin
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

```

---

### 2. `components/profiler/ResponseTab.jsx` (RawResponsePanel)

This component wraps the raw payload response using the `JsonViewer` component to allow clean copy-pasting, structured collapse views, and syntax highlighting.

```jsx
// components/profiler/ResponseTab.jsx
import { JsonViewer } from '../ui/JsonViewer.jsx'

/**
 * Raw Response Tab Panel component
 * @param {Object} props - Component props
 * @param {Object|Array|string} props.data - Response data payload
 * @returns {JSX.Element}
 */
export function ResponseTab({ data }) {
  return (
    <div className="p-4 md:p-md bg-surface flex-1 flex flex-col gap-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <span className="font-label-caps text-label-caps text-on-surface-variant">
          Response Payload (JSON)
        </span>
      </div>
      <JsonViewer data={data} maxHeight="500px" copyable={true} />
    </div>
  )
}

```

---

### 3. `components/ui/SqlHighlighter.jsx`

*(As provided in your reference, placed under `components/ui/SqlHighlighter.jsx` for clean component hierarchy).*

```jsx
// components/ui/SqlHighlighter.jsx
import { useEffect, useRef } from 'react'
import hljs from 'highlight.js/lib/core'
import sql from 'highlight.js/lib/languages/sql'
import pgsql from 'highlight.js/lib/languages/pgsql'
import 'highlight.js/styles/atom-one-dark.css'
import 'highlight.js/styles/atom-one-light.css'

hljs.registerLanguage('sql', sql)
hljs.registerLanguage('pgsql', pgsql)

const DIALECT_MAP = {
  postgres: 'pgsql',
  postgresql: 'pgsql',
  mysql: 'sql',
  sqlite: 'sql',
  sqlite3: 'sql',
}

function getLanguage(dialect = 'sql') {
  return DIALECT_MAP[dialect.toLowerCase()] || 'sql'
}

export function SqlHighlighter({ 
  sql, 
  className = '', 
  maxHeight = '300px', 
  theme = 'dark',
  dialect = 'sql'
}) {
  const preRef = useRef(null)
  const language = getLanguage(dialect)

  useEffect(() => {
    if (preRef.current) {
      hljs.highlightElement(preRef.current)
    }
  }, [sql, language])

  if (!sql) return null

  const themeClass = theme === 'dark' ? 'hljs atom-one-dark' : 'hljs atom-one-light'

  return (
    <div className={className} style={{ maxHeight, overflow: 'auto' }}>
      <pre style={{ margin: 0, padding: '0.5rem 0', fontSize: '0.875rem', lineHeight: '1.5' }}>
        <code 
          ref={preRef} 
          className={`${themeClass} language-${language} bg-transparent`}
          data-language={language}
        >
          {sql.trim()}
        </code>
      </pre>
    </div>
  )
}

export function InlineSql({ sql, className = '', theme = 'dark', dialect = 'sql' }) {
  const preRef = useRef(null)
  const language = getLanguage(dialect)

  useEffect(() => {
    if (preRef.current) {
      hljs.highlightElement(preRef.current)
    }
  }, [sql, language])

  if (!sql) return null

  const themeClass = theme === 'dark' ? 'hljs atom-one-dark' : 'hljs atom-one-light'

  return (
    <code 
      ref={preRef} 
      className={`${themeClass} language-${language} font-mono text-sm ${className}`}
      style={{ 
        padding: '0.25rem 0.5rem', 
        borderRadius: '0.25rem', 
        backgroundColor: theme === 'dark' ? '#282c34' : '#fafafa' 
      }}
      data-language={language}
    >
      {sql.trim()}
    </code>
  )
}

```

---

### Component Checklist Summary

* [x] `components/profiler/QueriesTab.jsx` (SQLQueriesPanel)
* [x] `components/profiler/ResponseTab.jsx` (RawResponsePanel)
* [x] `components/ui/SqlHighlighter.jsx`
