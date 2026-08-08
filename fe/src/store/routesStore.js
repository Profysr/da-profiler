// store/routesStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getRoutes } from '../api/endpoints.js'
import { ROUTE_FILTERS } from '../utils/constants.js'

function filterRoutes(routes, searchQuery, activeFilter) {
  const query = searchQuery.toLowerCase().trim()
  
  return routes.filter((route) => {
    // Filter by executable status
    if (activeFilter === 'executable' && !route.executable) return false
    if (activeFilter === 'params' && (!route.path_params || route.path_params.length === 0)) return false
    
    // Filter by search query
    if (query) {
      const searchableText = [
        route.path,
        route.name,
        route.view_class,
        route.target_model || '',
        route.app_name,
        route.namespace,
        ...route.methods,
      ].join(' ').toLowerCase()
      
      if (!searchableText.includes(query)) return false
    }
    
    return true
  })
}

export const useRoutesStore = create(
  persist(
    (set, get) => ({
      // State
      routes: [],
      filteredRoutes: [],
      selectedRoute: null,
      searchQuery: '',
      activeFilter: 'all',
      loading: false,
      error: null,
      count: 0,
      
      // Actions
      fetchRoutes: async () => {
        set({ loading: true, error: null })
        try {
          const data = await getRoutes()
          const routes = data.routes || []
          const filtered = filterRoutes(routes, get().searchQuery, get().activeFilter)
          set({ 
            routes, 
            filteredRoutes: filtered,
            count: data.count || routes.length,
            loading: false,
            error: null,
          })
        } catch (error) {
          set({ 
            loading: false, 
            error: error.message || 'Failed to fetch routes',
            routes: [],
            filteredRoutes: [],
            count: 0,
          })
        }
      },
      
      selectRoute: (route) => {
        set({ selectedRoute: route })
      },
      
      setSearchQuery: (query) => {
        const filtered = filterRoutes(get().routes, query, get().activeFilter)
        set({ searchQuery: query, filteredRoutes: filtered })
      },
      
      setActiveFilter: (filter) => {
        const filtered = filterRoutes(get().routes, get().searchQuery, filter)
        set({ activeFilter: filter, filteredRoutes: filtered })
      },
      
      clearSelection: () => {
        set({ selectedRoute: null })
      },
      
      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'dqs.routes',
      partialize: (state) => ({
        activeFilter: state.activeFilter,
        searchQuery: state.searchQuery,
      }),
    }
  )
)