import axios from 'axios'

export function getApiClient(baseUrl) {
  return axios.create({
    baseURL: baseUrl,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  })
}
