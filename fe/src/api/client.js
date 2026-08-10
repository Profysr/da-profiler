// api/client.js
import axios from 'axios'

const clientCache = new Map()

export function getApiClient(baseUrl) {
  const cacheKey = baseUrl
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)
  }

  const client = axios.create({
    baseURL: `${baseUrl}/dqs`,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 60000,
    withCredentials: true, // Send cookies for Django session
  })

  function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]')
    if (meta && meta.content) return meta.content
    const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/)
    return match ? decodeURIComponent(match[1]) : ''
  }

  client.interceptors.request.use((config) => {
    const token = getCsrfToken()
    if (token) {
      config.headers['X-CSRFToken'] = token
    }
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const message = error.response?.data?.error 
        || error.message 
        || 'An unexpected error occurred'
      const status = error.response?.status || 0
      
      const normalizedError = new Error(message)
      normalizedError.status = status
      normalizedError.data = error.response?.data
      
      return Promise.reject(normalizedError)
    }
  )

  clientCache.set(cacheKey, client)
  return client
}

export function clearClientCache() {
  clientCache.clear()
}