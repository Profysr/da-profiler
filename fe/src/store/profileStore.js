// store/profileStore.js
//
// Zustand store for the workbench's profile execution state. Holds:
//   - the last ProfileReport returned by the engine,
//   - loading + error flags,
//   - the last payload (so the UI can re-run with one click),
//   - actions: runProfile, clearResult, clearError, setResult.
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
  profileTarget: async (target, extraPayload = {}) => {
    const { getActiveConnection } = useConnectionsStore.getState()
    const connection = getActiveConnection()
    if (!connection) {
      throw new Error('No active connection')
    }

    const { target_details } = target
    const payload = {
      target_id: target.id,
      kind: target.kind,
      method: extraPayload.method || (target_details?.methods ? target_details.methods[0] : 'GET'),
      path: extraPayload.path || (target_details?.path || ''),
      path_params: target_details?.path_params || {},
      query_params: extraPayload.params || {},
      headers: extraPayload.headers || {},
      body: extraPayload.bodyContent,
      sandbox: true,
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