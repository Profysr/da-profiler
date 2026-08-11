# Da Profiler Frontend — Architecture Overview

A condensed map of the `fe/` codebase. Open this first; treat it as a single-page index before touching any file.

---

## 1. TL;DR

The frontend is a **React 19 + Vite + Tailwind v4** SPA. State lives in **Zustand** stores; data fetching is **Axios** against a Django `/dqs/*` backend; the API surface is the public contract.

Two parallel component trees currently exist:

| Tree | Location | Status | Entry Point |
|------|----------|--------|-------------|
| **Proton Workbench** (Postman-style, Proton Density design tokens) | `src/components/workbench/` | ✅ **Active** | `App.jsx` → `<Workbench />` |
| **Profiler Dashboard** (older dashboard layout) | `src/components/layout/`, `profiler/`, `dashboard/` | ⚠️ **Legacy / unused** | Not mounted — see `src/App.jsx` |

> The legacy tree is kept in the tree so existing hooks/stores/utilities can still be reused, but `App.jsx` does **not** render it. Treat all of its component files as **deprecated for the UI**, but **not** delete them — they share stores/hooks/utils with the active tree.

---

## 2. Where to Start

```
fe/
├── index.html              # Vite entry; loads Inter / JetBrains Mono / Material Symbols
├── package.json            # React 19, Tailwind v4, Zustand, Axios, Framer Motion, react-window
├── vite.config.js          # Port 3000, Tailwind plugin, React plugin
├── ARCHITECTURE.md         # ← you are here
├── README.md               # User-facing docs, quickstart, scripts
└── src/
    ├── main.jsx            # ReactDOM root; mounts <App/>
    ├── App.jsx             # ← currently renders <Workbench/> (active tree)
    ├── index.css           # Tailwind v4 @theme tokens — Proton Density palette + typography
    │
    ├── design-shift/       # Reference materials (YAML spec + screenshot + reference HTML)
    │
    ├── components/
    │   ├── workbench/      # ✅ ACTIVE — Proton Density UI (the workbench)
    │   ├── layout/         # ⚠️ Legacy — TopNavBar / SideNavBar / Layout
    │   ├── profiler/       # ⚠️ Legacy — ProfilerPanel + tab views
    │   ├── dashboard/      # ⚠️ Legacy — RouteList / RouteSearch / EmptyState
    │   ├── ui/             # Mixed — Button/Card/Tabs/SqlViewer reused; some legacy bits
    │   ├── animations/     # Framer Motion wrappers
    │   ├── ConnectionManager.jsx  # Project connection modal (legacy; backend deps live here)
    │   └── ProjectSelector.jsx    # Duplicate selector (legacy)
    │
    ├── api/                # Axios client + endpoint helpers
    ├── hooks/              # Custom React hooks (consume Zustand stores)
    ├── store/              # Zustand stores (connections, routes, profile, ui)
    ├── utils/              # Formatters, highlighters, constants, classNames
    └── assets/             # Static images
```

---

## 3. Active Tree — `components/workbench/`

Single source of truth for the current UI. Mirrors `src/design-shift/code (1).html` and `screen (1).png`.

| File | Role |
|------|------|
| `Workbench.jsx` | Top-level orchestrator. Renders the fixed-panel grid (48 px header · 260 px sidebar · resizable request/response split). Owns all top-level UI state. |
| `GlobalHeader.jsx` | 48 px header — brand label, workspace tabs, utility icon cluster, user avatar. |
| `SidebarNavigator.jsx` | 260 px sidebar — org/environment header, search, top-level nav, **Project** folder tree (API v1 / Auth / Celery / Signals), footer (New Request + utility icons). |
| `UrlBar.jsx` | Method selector + base URL + path + **Send** button row. |
| `DjangoRibbon.jsx` | Django-specific chrome: Act-As-User, Auth-Mode, Sandbox-Mode toggle. |
| `MethodSelector.jsx` | HTTP method picker. Two variants: `select` (dropdown) and `pills` (chip row). Semantic colors come from CSS tokens in `index.css`. |
| `PaneTabs.jsx` | Shared tab bar used by Request and Response panes. Folder-shaped (top-only 4 px radius). |
| `RequestWorkbench.jsx` | Upper split pane. Tabs: Params / Headers (7) / Body / Pre-request Script. |
| `ResponseWorkbench.jsx` | Lower split pane. Holds metrics bar + tabs (Body / Headers / SQL Logs / N+1 Warnings). |
| `ResponseMetrics.jsx` | The metrics strip above the response tabs: STATUS · TIME · SIZE · query duplicate warning. |
| `QueryWarningPanel.jsx` | N+1 warning body — banner + duplicated SQL snippet + Suggested Fix code block. Token-driven syntax coloring. |
| `data.js` | **Single source of structural data** — every constant array used by the workbench lives here (tabs, folders, methods, metrics, warning content). Render via `.map()`. |
| `index.js` | Barrel exports. |

### Render flow

```
App.jsx
 └─ <Workbench/>                [components/workbench/Workbench.jsx]
     ├─ <GlobalHeader/>         [data: WORKSPACE_TABS]
     ├─ <SidebarNavigator/>     [data: SIDEBAR_NAV_ITEMS, SIDEBAR_PROJECT_FOLDERS, SIDEBAR_FOOTER_ICONS]
     └─ <main>
         ├─ <UrlBar/>           [data: HTTP_METHODS via <MethodSelector/>]
         ├─ <DjangoRibbon/>     [data: DJANGO_RIBBON]
         └─ <split panes>
             ├─ <RequestWorkbench/>   [data: REQUEST_PANE_TABS]
             └─ <ResponseWorkbench/>  [data: RESPONSE_PANE_TABS, RESPONSE_METRICS, N1_WARNING_PANEL]
                 └─ <QueryWarningPanel/>  when active tab === 'n1-warnings'
```

---

## 4. Design System

The Proton Density design system lives **entirely** in `src/index.css` via Tailwind v4's `@theme` directive. No JS theme object.

- **Colors** — surface tonal ladder (`surface`, `surface-container-lowest…highest`, `surface-variant`); semantic (`primary`/`secondary`/`tertiary`/`error`); outlines (`outline`, `outline-variant`).
- **Typography** — 6 type styles: `headline-sm` · `body-md` · `body-sm` · `code-md` · `code-sm` · `label-caps`. Inter for UI; JetBrains Mono for code.
- **Spacing** — token-based: `panel-gap: 0`, `container-padding: 12px`, `element-gap: 8px`, `tight-gap: 4px`, `sidebar-width: 260px`, `header-height: 48px`.
- **Radius** — Soft 4 px default (`--radius-sm`); panels touching screen edges stay sharp (`border-radius: 0`).
- **Depth** — Flat. `.flat` + `.no-shadows` strip ambient shadow. Visual layering via `1px` borders + tonal surface shifts.
- **HTTP method colors** — `.method-get`, `.method-post`, `.method-put`, `.method-patch`, `.method-delete`, plus muted variants for inactive pills.
- **Material Symbols** — Icon font loaded via Google Fonts in `index.html`; used as `<span class="material-symbols-outlined">icon_name</span>`.

Tokens are mirrored as Tailwind utilities (`bg-surface`, `text-on-surface`, `border-outline-variant`, etc.) so component code reads in design-language directly.

---

## 5. Data Layer

### Stores (`src/store/`)

| Store | Responsibility |
|-------|---------------|
| `connectionsStore.js` | CRUD + persistence of Django project connections (Zustand persist). Provides `loadTargets` to the routes store. |
| `routesStore.js` | Discoverable targets, search/filter, selection. Subscribes to connection changes and re-fetches. |
| `profileStore.js` | Holds the latest `runProfile` result, loading/error state. |
| `uiStore.js` | Sidebar collapse, panel sizes, theme. **Theme is read by `App.jsx`** to toggle `<html class="dark">`. |

### API (`src/api/`)

- `client.js` — Axios factory keyed by base URL; CSRF injection; normalized errors.
- `endpoints.js` — `getHealth`, `getTargets`, `profileTarget`, legacy `getRoutes`/`profileRoute`.

### Hooks (`src/hooks/`)

- `useProfile.js`, `useRoutes.js`, `useHealth.js` — thin wrappers over stores.
- `useKeyboardShortcuts.js` — global hotkeys (`/` focus search, `Cmd/Ctrl+B` toggle sidebar, arrows nav tabs, `Enter` run profile).
- `useLocalStorage.js` — generic persistence primitive.
- `index.js` — barrel.

### Utils (`src/utils/`)

- `constants.js` — `METHOD_COLORS`, `TARGET_KINDS`, `TARGET_KIND_ORDER`, `ROUTE_FILTERS`, `PROFILER_TABS`, `STORAGE_KEYS`.
- `formatters.js` — `formatDuration`, `formatBytes`, `formatNumber`, `getStatusColors`, etc.
- `classNames.js` — `cn(...inputs)` via clsx + tailwind-merge.
- `jsonHighlighter.js` — Token-based JSON syntax highlighter (no deps).

---

## 6. Legacy / Deprecated Files

The following files are **not imported by `App.jsx`** and **should not be modified** when working on the active Proton Workbench tree. They are kept because (a) they share stores/hooks with the active tree, and (b) they may be referenced by external docs.

### Layout (`src/components/layout/`)
- `Layout.jsx`, `TopNavBar.jsx`, `SideNavBar.jsx` — Old layout shell.
- `index.js` re-exports `Header`/`Sidebar` from non-existent files — **broken barrel, unused.**

### Profiler (`src/components/profiler/`)
- `ProfilerPanel.jsx`, `ProfilerHeader.jsx`, `ProfilerControls.jsx`, `MetricsGrid.jsx`, `TabBar.jsx`, `tabs/*` — Old profiler view.
- `index.js` exports reference non-existent files — **broken barrel, unused.**

### Dashboard (`src/components/dashboard/`)
- `RouteList.jsx`, `RouteSearch.jsx`, `RouteFilters.jsx`, `EmptyState.jsx` — Old route discovery UI.

### UI (`src/components/ui/`) — mixed
- **Reusable & safe to import from active code:** `Button.jsx`, `Input.jsx`, `Card.jsx`, `Badge.jsx`, `Spinner.jsx`, `Modal.jsx`, `CopyButton.jsx`, `Tabs.jsx`, `Table.jsx`, `Select.jsx`, `Tooltip.jsx`, `JsonViewer.jsx`, `SqlHighlighter.jsx`, `SqlViewer.jsx`, `RouteFilterChips.jsx`.
- **Legacy / do not import into new workbench code:** `RouteCard.jsx`, `MetricCard.jsx`, `GlobalSearch.jsx`. The active tree ships its own equivalents.

### Root-level
- `ConnectionManager.jsx`, `ProjectSelector.jsx` — duplicated logic; **deprecated**. The active tree does not show project switching.

### Broken / orphaned
- Files referenced from barrels but **do not exist**:
  - `src/components/layout/Header.js`
  - `src/components/layout/Sidebar.js`
  - All `.js` (non-`.jsx`) siblings referenced in `src/components/{layout,profiler,dashboard,ui}/index.js`.
- Do not rely on the barrel files in `layout/`, `profiler/`, `dashboard/`. Use direct imports.

---

## 7. State Cheat-Sheet

| What | Where it lives | Read by |
|------|----------------|---------|
| Selected Django project / workspace | `connectionsStore.activeConnectionId` | `routesStore`, `profileStore` |
| List of targets / routes | `routesStore.filteredTargets` | Legacy `<SideNavBar/>` |
| Selected target | `routesStore.selectedTarget` | Legacy `<ProfilerPanel/>` |
| Last profile result | `profileStore.result` | Legacy `<ProfilerPanel/>`, tab views |
| Theme (dark/light) | `uiStore.theme` | `App.jsx` (`<html class="dark">`) |
| Sidebar collapse | `uiStore.sidebarCollapsed` | Legacy `<Layout/>` |

> The **active** `<Workbench/>` owns its UI state locally (`useState`). Stores still feed it once the active tree starts calling into the backend (currently static data from `workbench/data.js`).

---

## 8. Conventions

- **Component files**: `.jsx`. Hooks, stores, utils: `.js`. (Old barrels reference non-existent `.js` siblings — ignore them.)
- **Class naming**: tailwind-merge via `cn()` in `utils/classNames.js`; explicit Proton tokens (`bg-surface-container-low`, `border-outline-variant`, `font-code-md`).
- **Data-driven**: any repeated structural element lives as an array in `components/workbench/data.js` and is rendered via `.map()`.
- **No comments in source** unless explicitly requested — conventions carry intent.
- **Icons**: Material Symbols via `<span class="material-symbols-outlined">name</span>`. Use `lucide-react` only when an animated/sized SVG is needed (legacy tree).
- **No shadows**: `.flat`, `.no-shadows`, or rely on the global `[class*="shadow-"] { box-shadow: none !important; }` in `index.css`.

---

## 9. Scripts

```bash
npm run dev       # Vite dev server (port 3000)
npm run build     # Production build → dist/
npm run preview   # Preview production build
npm run lint      # ESLint (pre-existing errors in legacy tree; workbench is clean)
```

---

## 10. When You Need To…

| Task | Go to |
|------|-------|
| Add a workspace tab | `components/workbench/data.js` (`WORKSPACE_TABS`) |
| Add a sidebar nav item / project folder | `components/workbench/data.js` (`SIDEBAR_NAV_ITEMS`, `SIDEBAR_PROJECT_FOLDERS`) |
| Add an HTTP method | `components/workbench/data.js` (`HTTP_METHODS`) + CSS token in `index.css` (`method-X`) |
| Change request/response tabs | `components/workbench/data.js` (`REQUEST_PANE_TABS`, `RESPONSE_PANE_TABS`) |
| Edit the N+1 warning content | `components/workbench/data.js` (`N1_WARNING_PANEL`) |
| Adjust design tokens | `src/index.css` (`@theme` block) |
| Wire backend data into the workbench | Add new selectors to `store/*` and pass via props from `<Workbench/>` |
| Replace an icon | Material Symbols codepoint — search https://fonts.google.com/icons |
