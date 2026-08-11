// components/workbench/data.js

export const WORKSPACE_TABS = [
  { id: 'workspaces', label: 'Workspaces', icon: 'space_dashboard' },
  { id: 'collections', label: 'Collections', icon: 'folder_copy' },
  { id: 'environments', label: 'Environments', icon: 'deployed_code' },
  { id: 'history', label: 'History', icon: 'history' },
]

export const DEFAULT_WORKSPACE_TAB = 'workspaces'

export const SIDEBAR_NAV_ITEMS = [
  { id: 'collections', label: 'Collections', icon: 'folder' },
  { id: 'apis', label: 'APIs', icon: 'api' },
  { id: 'environments', label: 'Environments', icon: 'language' },
  { id: 'history', label: 'History', icon: 'history' },
]

export const SIDEBAR_PROJECT_FOLDERS = [
  { id: 'api-v1', label: 'API v1', icon: 'folder' },
  { id: 'auth', label: 'Auth', icon: 'folder' },
  { id: 'celery', label: 'Celery', icon: 'folder' },
  { id: 'signals', label: 'Signals', icon: 'folder' },
]

export const HTTP_METHODS = [
  { id: 'GET', label: 'GET' },
  { id: 'POST', label: 'POST' },
  { id: 'PUT', label: 'PUT' },
  { id: 'DELETE', label: 'DELETE' },
  { id: 'PATCH', label: 'PATCH' },
]

export const REQUEST_PANE_TABS = [
  { id: 'params', label: 'Params' },
  { id: 'headers', label: 'Headers (7)', count: 7 },
  { id: 'body', label: 'Body' },
  { id: 'pre-request', label: 'Pre-request Script' },
]

export const RESPONSE_PANE_TABS = [
  { id: 'body', label: 'Body' },
  { id: 'headers', label: 'Headers' },
  { id: 'sql-logs', label: 'SQL Logs' },
  { id: 'n1-warnings', label: 'N+1 Warnings', icon: 'warning', badge: 1, variant: 'error' },
]

export const RESPONSE_METRICS = [
  { id: 'status', label: 'STATUS', kind: 'status' },
  { id: 'time', label: 'TIME', kind: 'value' },
  { id: 'size', label: 'SIZE', kind: 'value' },
]

export const N1_WARNING_PANEL = {
  warning: {
    title: 'N+1 Query Detected in BookSerializer',
    body: 'Detected 4 identical queries fetching `Author` objects while serializing a list of `Book` instances. This indicates a missing select_related or prefetch_related.',
  },
  query: {
    label: 'DUPLICATED QUERY (x4)',
    metric: '0.8ms each',
    lines: [
      { tokens: [{ t: 'plain', v: 'SELECT ' }, { t: 'kw', v: '"myapp_author"."id", "myapp_author"."name"' }] },
      { tokens: [{ t: 'plain', v: 'FROM ' }, { t: 'kw', v: '"myapp_author"' }] },
      { tokens: [{ t: 'plain', v: 'WHERE ' }, { t: 'kw', v: '"myapp_author"."id" = ' }, { t: 'num', v: '42' }] },
      { tokens: [{ t: 'plain', v: 'LIMIT ' }, { t: 'num', v: '21' }, { t: 'plain', v: ';' }] },
    ],
    calledFrom: 'myapp/serializers.py:24',
    calledFromSymbol: 'get_author_name',
  },
  fix: {
    title: 'Suggested Fix',
    body: 'Update your ViewSet queryset to eagerly load the related author data.',
    lines: [
      [{ t: 'kw', v: 'class' }, { t: 'plain', v: ' ' }, { t: 'cls', v: 'BookViewSet' }, { t: 'plain', v: '(viewsets.ModelViewSet):' }],
      [{ t: 'plain', v: '    ' }, { t: 'cmt', v: '# Change this:' }],
      [{ t: 'plain', v: '    ' }, { t: 'del', v: 'queryset = Book.objects.all()' }],
      [],
      [{ t: 'plain', v: '    ' }, { t: 'cmt', v: '# To this:' }],
      [{ t: 'plain', v: '    ' }, { t: 'fix', v: "queryset = Book.objects.select_related('author').all()" }],
    ],
  },
}

export const DJANGO_RIBBON = {
  actAsUser: { label: 'ACT AS USER', icon: 'person', value: 'Admin ID: 1' },
  authMode: { label: 'AUTH MODE', icon: 'key', value: 'Session / Bearer' },
  sandboxMode: { label: 'SANDBOX MODE', enabled: true },
}

export const HEADER_ICON_BUTTONS = [
  { id: 'settings', icon: 'settings', title: 'settings' },
  { id: 'help', icon: 'help', title: 'help' },
  { id: 'notifications', icon: 'notifications', title: 'notifications' },
]

export const SIDEBAR_FOOTER_ICONS = [
  { id: 'trash', icon: 'delete', title: 'Trash' },
  { id: 'settings', icon: 'settings', title: 'Settings' },
]
