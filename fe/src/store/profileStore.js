import { create } from 'zustand'
import { executeRequest } from '../api/endpoints.js'
import { useConnectionsStore } from './connectionsStore.js'

export const useProfileStore = create((set, get) => ({
  // State
  result: null,
  loading: false,
  error: null,
  lastPayload: null,

  // Actions
  /**
   * Profile a selected target from the routes sidebar.
   * Posts to /profiler/execute and stores the result.
   */
  profileTarget: async (target, extraPayload = {}) => {
    const { getSelectedConnection, ensureConnectionAlive } = useConnectionsStore.getState()
    const connection = getSelectedConnection()
    if (!connection) {
      throw new Error('No selected connection')
    }

    // 1. Check if target is executable — if not, show static analysis message and return
    if (target.executable === false || target.executable === undefined && !target.can_execute) {
      set({
        loading: false,
        error: 'This endpoint is marked as non-executable — static analysis only. Requests cannot be sent to this route.',
        result: { error: 'This endpoint is marked as non-executable — static analysis only.', status_code: 0 },
      })
      throw new Error('This endpoint is marked as non-executable — static analysis only.')
    }

    // 1. Verify connection is alive before proceeding
    const health = await ensureConnectionAlive(connection.id)
    if (!health.success) {
      const errMessage = health.error || 'Connection inactive or misconfigured'
      set({
        loading: false,
        error: errMessage,
        result: { error: errMessage, status_code: health.status || 0 },
      })
      throw new Error(errMessage)
    }

    const payload = {
      target_id: target.id,
      kind: target.kind,

      path: extraPayload.path,
      method: extraPayload.method,
      path_params: extraPayload.path_params || {},
      query_params: extraPayload.query_params || {},
      headers: extraPayload.headers || {},
      body: extraPayload.body ?? null,

      sandbox: extraPayload.sandbox ?? false,  // isolate execution in a DB sandbox session
    }

    set({ loading: true, error: null, lastPayload: payload })

    const response = await executeRequest(connection.baseUrl, payload)

    if (!response.success) {
      const errorMessage = response.error || response.message || 'Profiling failed'
      set({
        loading: false,
        error: errorMessage,
        result: { error: errorMessage, status_code: response.status || 0 },
      })
      throw new Error(errorMessage)
    }

    const result = response.data
    set({ result, loading: false, error: null })
    return result
  },

  /**
   * ⚠️ DEPRECATED: Use profileTarget() instead.
   * This function exists for backward compatibility only.
   * profileTarget(target) automatically extracts target_id, kind,
   * method, path, etc. from a discovered target object, whereas
   * runProfile() expects a fully-constructed payload.
   *
   * Kept in the store for legacy support — will be removed in v0.4.0.
   * @deprecated Use profileTarget(target, extraPayload) for new code
   */
  runProfile: async (payload) => {
    const { getSelectedConnection, ensureConnectionAlive } = useConnectionsStore.getState()
    const connection = getSelectedConnection()
    if (!connection) {
      throw new Error('No selected connection')
    }

    // 1. Verify connection is alive before proceeding
    const health = await ensureConnectionAlive(connection.id)
    if (!health.success) {
      const errMessage = health.error || 'Connection inactive or misconfigured'
      set({
        loading: false,
        error: errMessage,
        result: { error: errMessage, status_code: health.status || 0 },
      })
      throw new Error(errMessage)
    }

    set({ loading: true, error: null, lastPayload: payload })

    const response = await executeRequest(connection.baseUrl, payload)

    if (!response.success) {
      const errorMessage = response.error || response.message || 'Profiling failed'
      set({
        loading: false,
        error: errorMessage,
        result: { error: errorMessage, status_code: response.status || 0 },
      })
      throw new Error(errorMessage)
    }

    const result = response.data
    set({ result, loading: false, error: null })
    return result
  },

  clearResult: () => {
    set({ result: null, error: null, lastPayload: null })
  },

  clearError: () => {
    set({ error: null })
  },

  setResult: (result) => {
    set({ result, loading: false })
  },
}))