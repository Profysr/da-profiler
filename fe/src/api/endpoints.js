// api/endpoints.js
//
// Thin wrappers around the DQS HTTP API. Every function takes the backend's
// base URL (e.g. "http://localhost:8000") and returns the parsed JSON
// payload. All endpoints live under the /profiler/ namespace.

import { getApiClient } from './client.js'

// GET /profiler/connection/health — quick sanity check that DQS is reachable + configured.
export async function getHealth(baseUrl) {
  const client = getApiClient(baseUrl)
  const response = await client.get('/profiler/connection/health')
  return response.data
}

// GET /profiler/manage/routes — list every discoverable target (views, tasks, consumers).
export async function getTargets(baseUrl) {
  const client = getApiClient(baseUrl)
  const response = await client.get('/profiler/manage/routes')
  return response.data
}

// POST /profiler/execute — run one request, return HTTP response + SQL trace.
//
// `payload` is the full request shape the runner expects:
//   {
//     target_id: "view:/api/v1/books/",
//     method: "POST",
//     path_params: { pk: 42 },
//     query_params: { page: 1 },
//     headers: { "X-Custom": "value" },
//     body: { title: "Clean Code" },
//     sandbox: true,   // default — writes roll back
//   }
export async function executeRequest(baseUrl, payload) {
  const client = getApiClient(baseUrl)
  const response = await client.post('/profiler/execute', payload)
  return response.data
}
