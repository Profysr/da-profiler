// utils/constants.js

/**
 * HTTP Method to CSS class mapping (matching new design tokens)
 */
export const METHOD_COLORS = {
  GET: 'method-get',
  POST: 'method-post',
  PUT: 'method-put',
  PATCH: 'method-put',
  DELETE: 'method-delete',
  HEAD: 'method-badge badge-gray',
  OPTIONS: 'method-badge badge-gray',
}

/**
 * Status code CSS class mapping
 */
export const STATUS_COLORS = {
  2: 'status-2xx',
  3: 'status-3xx',
  4: 'status-4xx',
  5: 'status-5xx',
}

/**
 * Converter placeholder mapping
 */
export const CONVERTER_PLACEHOLDERS = {
  int: '42',
  uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  slug: 'my-slug',
  str: 'value',
  path: 'path/to/resource',
  default: 'value',
}

/**
 * localStorage keys
 */
export const STORAGE_KEYS = {
  SIDEBAR_COLLAPSED: 'dqs.sidebar.collapsed',
  SIDEBAR_WIDTH: 'dqs.sidebar.width',
  SELECTED_ROUTE: 'dqs.selectedRoute',
  PANEL_SIZES: 'dqs.panelSizes',
  LAST_FILTER: 'dqs.lastFilter',
  THEME: 'dqs.theme',
}

/**
 * Animation durations (ms)
 */
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 250,
  slow: 350,
}

/**
 * Query param default limits
 */
export const QUERY_PARAM_LIMITS = {
  MAX_ROWS: 1000,
  MAX_SEED_COUNT: 100,
}

/**
 * Default route filter options
 */
export const ROUTE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'executable', label: 'Executable' },
  { value: 'params', label: 'Requires Params' },
]

/**
 * Profiler tab configuration
 */
export const PROFILER_TABS = [
  { id: 'n1', label: 'N+1 Analysis' },
  { id: 'queries', label: 'SQL Queries' },
  { id: 'sideEffects', label: 'Side Effects' },
  { id: 'response', label: 'Response Body' },
  { id: 'logs', label: 'Logs' },
  { id: 'timeline', label: 'Timeline' },
]