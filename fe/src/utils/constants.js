// utils/constants.js

import { Globe, Cpu, Zap, Bell, Play, FileText, Bug, Database, AlertTriangle, FileCode, List, Activity } from 'lucide-react'

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
 * Target kind configuration with icons and styling
 */
export const TARGET_KINDS = {
  view: {
    icon: Globe,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/20',
    label: 'HTTP Views',
    shortLabel: 'Views',
    triggerable: true,
    description: 'Django REST Framework API endpoints',
  },
  task: {
    icon: Cpu,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/20',
    label: 'Celery Tasks',
    shortLabel: 'Tasks',
    triggerable: false,
    description: 'Background Celery tasks (static analysis only)',
  },
  consumer: {
    icon: Zap,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    borderColor: 'border-orange-400/20',
    label: 'WebSocket Consumers',
    shortLabel: 'Consumers',
    triggerable: false,
    description: 'Django Channels WebSocket consumers (static analysis only)',
  },
  signal: {
    icon: Bell,
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    borderColor: 'border-green-400/20',
    label: 'Django Signals',
    shortLabel: 'Signals',
    triggerable: false,
    description: 'Model signal receivers (static analysis only)',
  },
}

export const TARGET_KIND_ORDER = ['view', 'task', 'consumer', 'signal']

/**
 * Default route filter options
 */
export const ROUTE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'executable', label: 'Executable' },
  { value: 'params', label: 'Requires Params' },
  { value: 'kind:view', label: 'Views Only' },
  { value: 'kind:task', label: 'Tasks Only' },
  { value: 'kind:consumer', label: 'Consumers Only' },
  { value: 'kind:signal', label: 'Signals Only' },
]

/**
 * Profiler tab configuration
 */
export const PROFILER_TABS = [
  { id: "summary", label: "Summary", icon: Bug, variant: "error" },
  { id: "queries", label: "SQL Queries", icon: Database, variant: "default" },
  {
    id: "sideEffects",
    label: "Side Effects",
    icon: AlertTriangle,
    variant: "default",
  },
  { id: "response", label: "Raw Response", icon: FileCode, variant: "default" },
  { id: "headers", label: "Headers", icon: FileList, variant: "default" },
  { id: "logs", label: "Logs", icon: List, variant: "default" },
  { id: "timeline", label: "Timeline", icon: Activity, variant: "default" },
];