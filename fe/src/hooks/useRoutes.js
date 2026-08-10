// hooks/useRoutes.js
import { useEffect, useCallback } from 'react'
import { useRoutesStore } from '../store/routesStore.js'
import { useConnectionsStore } from '../store/connectionsStore.js'

export function useRoutes() {
  const {
    targets,
    filteredTargets,
    selectedTarget,
    searchQuery,
    activeFilter,
    loading,
    error,
    counts,
    total,
    fetchTargets,
    selectTarget,
    setSearchQuery,
    setActiveFilter,
    clearSelection,
    clearError,
  } = useRoutesStore()
  
  const { activeConnectionId } = useConnectionsStore()
  
  // Fetch targets when active connection changes
  useEffect(() => {
    if (activeConnectionId) {
      fetchTargets()
    }
  }, [activeConnectionId, fetchTargets])
  
  // Memoized actions
  const handleSelectTarget = useCallback((target) => {
    selectTarget(target)
  }, [selectTarget])
  
  const handleSearch = useCallback((query) => {
    setSearchQuery(query)
  }, [setSearchQuery])
  
  const handleFilterChange = useCallback((filter) => {
    setActiveFilter(filter)
  }, [setActiveFilter])
  
  const handleClearSelection = useCallback(() => {
    clearSelection()
  }, [clearSelection])
  
  const handleClearError = useCallback(() => {
    clearError()
  }, [clearError])
  
  return {
    // Data
    targets,
    filteredTargets,
    selectedTarget,
    searchQuery,
    activeFilter,
    loading,
    error,
    counts,
    total,
    
    // Actions
    fetchTargets,
    selectTarget: handleSelectTarget,
    setSearchQuery: handleSearch,
    setActiveFilter: handleFilterChange,
    clearSelection: handleClearSelection,
    clearError: handleClearError,
  }
}