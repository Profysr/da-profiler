// store/profileStore.js
import { create } from 'zustand'
import { profileRoute } from '../api/endpoints.js'

/**
 * Profile store for profiling results
 */
export const useProfileStore = create((set) => ({
  // State
  result: null,
  loading: false,
  error: null,
  lastPayload: null,
  
  // Actions
  runProfile: async (payload) => {
    set({ loading: true, error: null, lastPayload: payload })
    try {
      const result = await profileRoute(payload)
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