// api/endpoints.js
import { getApiClient } from './client.js'

export async function getHealth(baseUrl) {
  const client = getApiClient(baseUrl)
  const response = await client.get('/health/')
  return response.data
}

export async function getTargets(baseUrl) {
  const client = getApiClient(baseUrl)
  const response = await client.get('/targets/')
  return response.data
}

export async function profileTarget(baseUrl, payload) {
  const client = getApiClient(baseUrl)
  const response = await client.post('/profile/', payload)
  return response.data
}

// Legacy support for old API
export async function getRoutes(baseUrl) {
  const client = getApiClient(baseUrl)
  const response = await client.get('/')
  return response.data
}

export async function profileRoute(baseUrl, payload) {
  const client = getApiClient(baseUrl)
  const response = await client.post('/profile/', payload)
  return response.data
}