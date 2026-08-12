// utils/constants.js

import {
  Globe,
  Cpu,
  Zap,
  Bell,
  HelpCircle,
  Settings,
  FolderOpen,
  Server,
  History,
  LayoutDashboard,
} from 'lucide-react'

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
 * Workspace tab configuration for the top-level navigator
 */
export const WORKSPACE_TABS = [
  { id: 'workspaces', label: 'Workspaces', icon: LayoutDashboard },
  { id: 'collections', label: 'Collections', icon: FolderOpen },
  { id: 'environments', label: 'Environments', icon: Server },
  { id: 'history', label: 'History', icon: History },
]

/**
 * HTTP methods available in the request workbench
 */
export const HTTP_METHODS = [
  { id: 'GET', label: 'GET' },
  { id: 'POST', label: 'POST' },
  { id: 'PUT', label: 'PUT' },
  { id: 'DELETE', label: 'DELETE' },
  { id: 'PATCH', label: 'PATCH' },
]

/**
 * Icon buttons rendered in the global header
 */
export const HEADER_ICON_BUTTONS = [
  { id: 'settings', icon: Settings, title: 'Settings' },
  { id: 'help', icon: HelpCircle, title: 'Help' },
  { id: 'notifications', icon: Bell, title: 'Notifications' },
]

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
    can_execute: true,
    description: 'Django REST Framework API endpoints',
  },
  task: {
    icon: Cpu,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/20',
    label: 'Celery Tasks',
    shortLabel: 'Tasks',
  can_execute: false,
  description: 'Background Celery tasks (static analysis only)',
  },
  consumer: {
    icon: Zap,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    borderColor: 'border-orange-400/20',
    label: 'WebSocket Consumers',
    shortLabel: 'Consumers',
  can_execute: false,
  description: 'Django Channels WebSocket consumers (static analysis only)',
  },
  signal: {
    icon: Bell,
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    borderColor: 'border-green-400/20',
    label: 'Django Signals',
    shortLabel: 'Signals',
  can_execute: false,
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
