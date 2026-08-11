// utils/formatters.js
export function formatDuration(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(1)}µs`
  if (ms < 1000) return `${ms.toFixed(2)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function formatNumber(num) {
  return new Intl.NumberFormat().format(num)
}

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function formatRelativeTime(date) {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now - then
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return then.toLocaleDateString()
}

export function truncate(str, maxLength = 50) {
  if (!str || str.length <= maxLength) return str
  return `${str.slice(0, maxLength)}...`
}

export function getStatusCategory(statusCode) {
  if (statusCode >= 200 && statusCode < 300) return '2xx'
  if (statusCode >= 300 && statusCode < 400) return '3xx'
  if (statusCode >= 400 && statusCode < 500) return '4xx'
  if (statusCode >= 500) return '5xx'
  return 'unknown'
}

export function getStatusColors(statusCode) {
  const category = getStatusCategory(statusCode)
  const colors = {
    '2xx': { bg: 'bg-accent-green/15', text: 'text-accent-green' },
    '3xx': { bg: 'bg-accent-orange/15', text: 'text-accent-orange' },
    '4xx': { bg: 'bg-accent-red/15', text: 'text-accent-red' },
    '5xx': { bg: 'bg-accent-red/30', text: 'text-accent-red' },
  }
  return colors[category] || colors['2xx']
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

export function debounce(fn, delay) {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}