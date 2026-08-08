// api/endpoints.js
import apiClient from './client.js'

/**
 * Fetch all discoverable routes
 * @returns {Promise<DashboardResponse>} Routes list
 */
export async function getRoutes() {
  const response = await apiClient.get('/')
  return response.data
}

/**
 * Profile a specific route
 * @param {ProfileRequest} payload - Profile request payload
 * @returns {Promise<ExecutionResult>} Profile result
 */
export async function profileRoute(payload) {
  const response = await apiClient.post('/profile/', payload)
  return response.data
}

/**
 * Check health status
 * @returns {Promise<HealthResponse>} Health status
 */
export async function getHealth() {
  const response = await apiClient.get('/health/')
  return response.data
}