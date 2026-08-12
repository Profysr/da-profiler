import { create } from 'zustand'
import { getApiClient } from '../api/client.js'
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
   * Automatically builds the payload from target.id, target.kind,
   * target.target_details.methods, target.target_details.path, etc.
   * Posts to /profiler/execute and stores the result.
   *
   * @param target - The selected target object from useRoutesStore
   * @param extraPayload - Optional overrides for method, path, params, headers, bodyContent
   * @returns The ProfileResult from the backend
   */
  profileTarget: async (target, extraPayload = {}) => {
    const { getActiveConnection } = useConnectionsStore.getState()
    const connection = getActiveConnection()
    if (!connection) {
      throw new Error('No active connection')
    }

    const payload = {
      target_id: target.id,
      kind: target.kind,

      method: extraPayload.method,
      path: extraPayload.path,
      path_params: extraPayload.path_params || {},
      query_params: extraPayload.params || {},
      headers: extraPayload.headers || {},
      body: extraPayload.bodyContent,
    }

    set({ loading: true, error: null, lastPayload: payload })
    try {
      const client = getApiClient(connection.baseUrl)
      const response = await client.post('/profiler/execute', payload)
      const result = response.data
      set({ result, loading: false, error: null })
      return result
    } catch (error) {
      const errorMessage = error.message || 'Profiling failed'
      set({
        loading: false,
        error: errorMessage,
        result: { error: errorMessage, status_code: error.status || 0 },
      })
      throw error
    }
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
    const { getActiveConnection } = useConnectionsStore.getState();
    const connection = getActiveConnection();
    if (!connection) {
      throw new Error('No active connection');
    }

    set({ loading: true, error: null, lastPayload: payload })
    try {
      const client = getApiClient(connection.baseUrl);
      const response = await client.post('/profiler/execute', payload);
      const result = response.data;
      set({ result, loading: false, error: null })
      return result
    } catch (error) {
      const errorMessage = error.message || 'Profiling failed'
      set({
        loading: false,
        error: errorMessage,
        result: { error: errorMessage, status_code: error.status || 0 },
      })
      throw error
    }
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