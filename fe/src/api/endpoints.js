// api/endpoints.js
import apiClient from './client.js'

export async function getRoutes() {
  const response = await apiClient.get('/')
  return response.data
}

export async function profileRoute(payload) {
  const response = await apiClient.post('/profile/', payload)
  return response.data
}

export async function getHealth() {
  const response = await apiClient.get('/health/')
  return response.data
}