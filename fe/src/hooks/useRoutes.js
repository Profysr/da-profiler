// hooks/useRoutes.js
import { useEffect, useCallback } from 'react'
import { useRoutesStore } from '../store/routesStore.js'

/**
 * Hook for managing routes data and selection
 */
export function useRoutes() {
  const {
    routes,
    filteredRoutes,
    selectedRoute,
    searchQuery,
    activeFilter,
    loading,
    error,
    count,
    fetchRoutes,
    selectRoute,
    setSearchQuery,
    setActiveFilter,
    clearSelection,
    clearError,
  } = useRoutesStore()
  
  // Fetch routes on mount
  useEffect(() => {
    fetchRoutes()
  }, [fetchRoutes])
  
  // Memoized actions
  const handleSelectRoute = useCallback((route) => {
    selectRoute(route)
  }, [selectRoute])
  
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
    routes,
    filteredRoutes,
    selectedRoute,
    searchQuery,
    activeFilter,
    loading,
    error,
    count,
    
    // Actions
    fetchRoutes,
    selectRoute: handleSelectRoute,
    setSearchQuery: handleSearch,
    setActiveFilter: handleFilterChange,
    clearSelection: handleClearSelection,
    clearError: handleClearError,
  }
}