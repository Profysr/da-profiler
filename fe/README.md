# Da Profiler Frontend

Interactive React-based dashboard for Da Profiler - visualize and analyze Django query performance with N+1 detection, SQL inspection, and response analysis.

## Features

- **Route Discovery** - Searchable, filterable sidebar of all DRF endpoints
- **Interactive Profiling** - Select route → configure params → run sandboxed profile
- **N+1 Detection** - Visual cards with copy-paste `.select_related()` fixes
- **Query Inspector** - Syntax-highlighted SQL with duration, source location
- **Response Viewer** - Formatted JSON with syntax highlighting
- **Dark Mode** - Postman-inspired theme, keyboard shortcuts
- **Responsive Layout** - Collapsible sidebar, resizable panels

## Quick Start

### Prerequisites

- Node.js 18+
- Django backend running with `da-profiler` installed and `DEBUG=True`

### Installation

```bash
cd fe
npm install
```

### Development

```bash
npm run dev
```

Opens http://localhost:3000 with Vite proxy forwarding `/dqs/*` to Django on http://localhost:8000.

### Production Build

```bash
npm run build
```

Outputs to `fe/dist/` - serve via Django whitenoise or nginx.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus route search |
| `Enter` | Run profile (when in controls) |
| `←` / `→` | Navigate tabs |
| `Escape` | Clear search / blur |
| `Cmd/Ctrl + B` | Toggle sidebar |

## Project Structure

```
fe/
├── src/
│   ├── api/              # API client & endpoints
│   ├── components/
│   │   ├── layout/       # Header, Sidebar, Layout
│   │   ├── dashboard/    # Route list, search, filters
│   │   ├── profiler/     # Profiler panel, tabs, metrics
│   │   ├── ui/           # Reusable UI components
│   │   └── animations/   # Framer Motion wrappers
│   ├── hooks/            # Custom React hooks
│   ├── store/            # Zustand stores
│   ├── utils/            # Formatters, highlighters, constants
│   ├── App.jsx           # Root component
│   └── main.jsx          # Entry point
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## Architecture

- **React 18** + **Vite** + **Tailwind CSS**
- **Zustand** for state management
- **Framer Motion** for animations
- **react-window** for virtualized lists
- Custom SQL/JSON syntax highlighters (zero dependencies)
- Axios with CSRF protection

## API Integration

The frontend consumes these Django endpoints (mounted at `/dqs/`):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | List all discoverable routes |
| `/profile/` | POST | Profile a specific route |
| `/health/` | GET | Health check & config status |

## Configuration

### Vite Proxy (Development)

```javascript
// vite.config.js
server: {
  proxy: {
    '/dqs': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

### Backend Requirements

- Django with `da-profiler` installed
- `DEBUG=True` in settings
- `dqs.adapters.drf` in `INSTALLED_APPS`
- Shadow database configured (`dqs_shadow`)

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
npm run format    # Format with Prettier
```

## License

MIT