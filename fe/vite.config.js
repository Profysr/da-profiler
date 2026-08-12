import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
//
// ELI5: We intentionally have NO `server.proxy` config here.
//
// The workbench supports multiple backends running on arbitrary ports via
// the Connection Manager UI (fe/src/components/ConnectionManager.jsx). Each
// connection stores its own `baseUrl` (e.g. "http://localhost:8000"),
// and the axios client (fe/src/api/client.js) calls it directly.
//
// CORS for these dev-time cross-origin calls is handled on the Django side
// by dqs/adapters/drf/views.py — see `CORSEnabledAPIView` and
// `_DEFAULT_CORS_ORIGINS`. The frontend origin (localhost:3000 / 5173) is
// whitelisted there. As long as the dev origin matches one of those, no
// vite proxy is needed and the backend port is fully dynamic.
//
// If you need a proxy for some local-only reason (e.g. a corporate TLS
// terminator that strips Origin headers), re-add the `proxy` block below
// and override the target via env, but the default UX assumes direct calls.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
