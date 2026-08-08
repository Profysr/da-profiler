// hooks/useHealth.js
import { useEffect, useCallback } from 'react'
import { getHealth } from '../api/endpoints.js'
import { useUIStore } from '../store/uiStore.js'

export function useHealth() {
  const { setHealthStatus, healthStatus, lastHealthCheck } = useUIStore()
  
  const checkHealth = useCallback(async () => {
    try {
      const data = await getHealth()
      const isHealthy = data.status === 'ok' && data.debug
      setHealthStatus(isHealthy ? 'connected' : 'disconnected')
      return data
    } catch {
      setHealthStatus('disconnected')
      return null
    }
  }, [setHealthStatus])
  
  // Check health on mount
  useEffect(() => {
    checkHealth()
  }, [checkHealth])
  
  return {
    healthStatus,
    lastHealthCheck,
    checkHealth,
  }
}