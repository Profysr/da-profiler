// api/client.js
import axios from 'axios'

export function getApiClient(baseUrl) {
  const normalizedUrl = baseUrl ? baseUrl.replace(/\/$/, '') : ''
  return axios.create({
    baseURL: normalizedUrl,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Unified API request handler.
 * Sends request and returns standard response shape for both success and failure:
 * { success: boolean, data: any | null, error: string | null, message: string, status: number | null }
 */
export async function sendApiRequest(baseUrl, { method = 'GET', url, data = null, params = null, headers = {} } = {}) {
  const client = getApiClient(baseUrl)
  try {
    const response = await client.request({
      method,
      url,
      data,
      params,
      headers,
    })
    return {
      success: true,
      data: response.data,
      error: null,
      message: 'Success',
      status: response.status,
    }
  } catch (err) {
    const statusCode = err.response?.status || null
    const errorMessage =
      err.response?.data?.error ||
      err.message ||
      'Request failed. Please check network connection.'
    
    return {
      success: false,
      data: err.response?.data || null,
      error: errorMessage,
      message: errorMessage,
      status: statusCode,
    }
  }
}
