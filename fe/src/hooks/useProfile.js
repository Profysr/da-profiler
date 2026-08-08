// hooks/useProfile.js
import { useCallback } from 'react'
import { useProfileStore } from '../store/profileStore.js'

export function useProfile() {
  const {
    result,
    loading,
    error,
    lastPayload,
    runProfile,
    clearResult,
    clearError,
    setResult,
  } = useProfileStore()
  
  const executeProfile = useCallback(async (payload) => {
    return await runProfile(payload)
  }, [runProfile])
  
  const handleClearResult = useCallback(() => {
    clearResult()
  }, [clearResult])
  
  const handleClearError = useCallback(() => {
    clearError()
  }, [clearError])
  
  return {
    // Data
    result,
    loading,
    error,
    lastPayload,
    
    // Actions
    runProfile: executeProfile,
    clearResult: handleClearResult,
    clearError: handleClearError,
    setResult,
  }
}