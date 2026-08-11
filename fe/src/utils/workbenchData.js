import {
  LayoutDashboard,
  FolderOpen,
  Server,
  History,
  Settings,
  HelpCircle,
  Bell,
} from 'lucide-react'

// src/utils/workbenchData.js
export const WORKSPACE_TABS = [
  { id: 'workspaces', label: 'Workspaces', icon: LayoutDashboard },
  { id: 'collections', label: 'Collections', icon: FolderOpen },
  { id: 'environments', label: 'Environments', icon: Server },
  { id: 'history', label: 'History', icon: History },
]

export const HTTP_METHODS = [
  { id: 'GET', label: 'GET' },
  { id: 'POST', label: 'POST' },
  { id: 'PUT', label: 'PUT' },
  { id: 'DELETE', label: 'DELETE' },
  { id: 'PATCH', label: 'PATCH' },
]

export const HEADER_ICON_BUTTONS = [
  { id: 'settings', icon: Settings, title: 'Settings' },
  { id: 'help', icon: HelpCircle, title: 'Help' },
  { id: 'notifications', icon: Bell, title: 'Notifications' },
]
