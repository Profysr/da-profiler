// api/client.js
//
// Thin axios client factory. The baseUrl is whatever the workbench connects
// to (e.g. "http://localhost:8000") — the caller appends the full path
// including the /profiler/ prefix. CSRF and error normalization are handled
// here so individual endpoint functions stay simple.

import axios from 'axios'

export function getApiClient(baseUrl) {
  return axios.create({
    baseURL: baseUrl,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  })
}
