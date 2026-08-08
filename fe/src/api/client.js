// api/client.js
import axios from 'axios'

/**
 * Create axios instance with base configuration
 */
const apiClient = axios.create({
  baseURL: '/dqs',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds for profiling requests
})

/**
 * Get CSRF token from cookie or meta tag
 * @returns {string} CSRF token
 */
function getCsrfToken() {
  // Try meta tag first
  const meta = document.querySelector('meta[name="csrf-token"]')
  if (meta && meta.content) return meta.content
  
  // Try cookie
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

/**
 * Request interceptor - add CSRF token
 */
apiClient.interceptors.request.use((config) => {
  const token = getCsrfToken()
  if (token) {
    config.headers['X-CSRFToken'] = token
  }
  return config
})

/**
 * Response interceptor - normalize errors
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error 
      || error.message 
      || 'An unexpected error occurred'
    const status = error.response?.status || 0
    
    // Create normalized error
    const normalizedError = new Error(message)
    normalizedError.status = status
    normalizedError.data = error.response?.data
    
    return Promise.reject(normalizedError)
  }
)

export default apiClient