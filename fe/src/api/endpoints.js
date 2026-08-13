// api/endpoints.js

import { sendApiRequest } from './client.js'

/**
 * GET /profiler/connection/health
 * Verifies backend connectivity, DEBUG status, and shadow DB configuration.
 * Returns standard shape: { success, data, error, message, status }
 */
export async function getHealth(baseUrl) {
  const res = await sendApiRequest(baseUrl, {
    method: 'GET',
    url: '/profiler/connection/health',
  })

  if (!res.success) {
    return {
      success: false,
      data: res.data,
      error: res.error || 'Connection unreachable.',
      message: res.message || 'Connection unreachable.',
      status: res.status,
    }
  }

  const isHealthy = res.data?.status === 'ok' && res.data?.debug === true
  if (!isHealthy) {
    const errorMsg =
      res.data?.error ||
      'Connection is inactive or misconfigured (DEBUG=True required). Check Setup Guide'
    return {
      success: false,
      data: res.data,
      error: errorMsg,
      message: errorMsg,
      status: res.status,
    }
  }

  return {
    success: true,
    data: res.data,
    error: null,
    message: 'Connection healthy',
    status: res.status,
  }
}

/**
 * GET /profiler/manage/routes — list discoverable targets (views, tasks, consumers).
 * Returns standard shape: { success, data, error, message, status }
 */
export async function getTargets(baseUrl) {
  return await sendApiRequest(baseUrl, {
    method: 'GET',
    url: '/profiler/manage/routes',
  })
}

/**
 * POST /profiler/execute — run request in sandbox and return HTTP response + SQL trace.
 * Returns standard shape: { success, data, error, message, status }
 */
export async function executeRequest(baseUrl, payload) {
  return await sendApiRequest(baseUrl, {
    method: 'POST',
    url: '/profiler/execute',
    data: payload,
  })
}
