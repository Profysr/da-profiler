// utils/constants.js

/**
 * HTTP Method to color mapping
 */
export const METHOD_COLORS = {
  GET: { bg: 'bg-accent-blue/15', text: 'text-accent-blue', border: 'border-accent-blue/30' },
  POST: { bg: 'bg-accent-green/15', text: 'text-accent-green', border: 'border-accent-green/30' },
  PUT: { bg: 'bg-accent-orange/15', text: 'text-accent-orange', border: 'border-accent-orange/30' },
  PATCH: { bg: 'bg-accent-orange/15', text: 'text-accent-orange', border: 'border-accent-orange/30' },
  DELETE: { bg: 'bg-accent-red/15', text: 'text-accent-red', border: 'border-accent-red/30' },
  HEAD: { bg: 'bg-bg-tertiary', text: 'text-text-secondary', border: 'border-border' },
  OPTIONS: { bg: 'bg-bg-tertiary', text: 'text-text-secondary', border: 'border-border' },
}

/**
 * Status code color mapping
 */
export const STATUS_COLORS = {
  2: { bg: 'bg-accent-green/15', text: 'text-accent-green', label: 'Success' },
  3: { bg: 'bg-accent-orange/15', text: 'text-accent-orange', label: 'Redirect' },
  4: { bg: 'bg-accent-red/15', text: 'text-accent-red', label: 'Client Error' },
  5: { bg: 'bg-accent-red/30', text: 'text-accent-red', label: 'Server Error' },
}

/**
 * Status code pill classes
 */
export const STATUS_PILL_CLASSES = {
  '2xx': 'status-2xx',
  '3xx': 'status-3xx',
  '4xx': 'status-4xx',
  '5xx': 'status-5xx',
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
  { value: 'all', label: 'All', icon: 'List' },
  { value: 'executable', label: 'Executable', icon: 'Play' },
  { value: 'params', label: 'Requires Params', icon: 'Key' },
]

/**
 * Profiler tab configuration
 */
export const PROFILER_TABS = [
  { id: 'n1', label: 'N+1 Analysis', icon: 'GitMerge' },
  { id: 'queries', label: 'All Queries', icon: 'Database' },
  { id: 'sideEffects', label: 'Side Effects', icon: 'AlertTriangle' },
  { id: 'response', label: 'Response Body', icon: 'FileJson' },
]