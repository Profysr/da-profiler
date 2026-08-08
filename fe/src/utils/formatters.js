// utils/formatters.js

/**
 * Format duration in milliseconds to human readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
export function formatDuration(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(1)}µs`
  if (ms < 1000) return `${ms.toFixed(2)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  return new Intl.NumberFormat().format(num)
}

/**
 * Format bytes to human readable string
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted bytes
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Format date to relative time
 * @param {Date|string|number} date - Date to format
 * @returns {string} Relative time string
 */
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

/**
 * Truncate string with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
export function truncate(str, maxLength = 50) {
  if (!str || str.length <= maxLength) return str
  return `${str.slice(0, maxLength)}...`
}

/**
 * Get status code category (2xx, 3xx, etc.)
 * @param {number} statusCode - HTTP status code
 * @returns {string} Status category
 */
export function getStatusCategory(statusCode) {
  if (statusCode >= 200 && statusCode < 300) return '2xx'
  if (statusCode >= 300 && statusCode < 400) return '3xx'
  if (statusCode >= 400 && statusCode < 500) return '4xx'
  if (statusCode >= 500) return '5xx'
  return 'unknown'
}

/**
 * Get status color classes
 * @param {number} statusCode - HTTP status code
 * @returns {object} Color classes
 */
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

/**
 * Deep clone an object
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Debounce function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in ms
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay) {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}