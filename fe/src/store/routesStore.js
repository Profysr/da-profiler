// store/routesStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useConnectionsStore } from './connectionsStore.js'

function filterRoutes(routes, searchQuery, activeFilter) {
  const query = searchQuery.toLowerCase().trim()
  
  return routes.filter((route) => {
    // Filter by executable status
if (activeFilter === 'executable' && !route.can_execute) return false
if (activeFilter === 'params' && (!route.target_details?.path_params || route.target_details.path_params.length === 0)) return false
    
    // Filter by kind
    if (activeFilter.startsWith('kind:')) {
      const kind = activeFilter.replace('kind:', '')
      if (route.kind !== kind) return false
    }
    
    // Filter by search query
    if (query) {
      const searchableText = [
        route.target_details?.path || '',
        route.name || '',
        route.target_details?.task_name || '',
        route.target_details?.consumer || '',
        route.target_details?.signal || '',
        route.target_details?.receiver || '',
        ...(route.target_details?.methods || []),
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
      targets: [],
      filteredTargets: [],
      selectedTarget: null,
      searchQuery: '',
      activeFilter: 'all',
      loading: false,
      error: null,
      counts: {},
      total: 0,
      
      // Actions
      fetchTargets: async () => {
        const { loadTargets } = useConnectionsStore.getState()
        set({ loading: true, error: null })
        try {
          const data = await loadTargets()
          if (data.error) {
            set({ 
              loading: false, 
              error: data.error,
              targets: [],
              filteredTargets: [],
              counts: {},
              total: 0,
            })
            return { error: data.error }
          }
          const targets = data.targets || []
          const filtered = filterRoutes(targets, get().searchQuery, get().activeFilter)
          set({ 
            targets, 
            filteredTargets: filtered,
            counts: data.counts || {},
            total: data.total || targets.length,
            loading: false,
            error: null,
          })
          return { error: null }
        } catch (error) {
          const errMessage = error.message || 'Failed to fetch targets'
          set({ 
            loading: false, 
            error: errMessage,
            targets: [],
            filteredTargets: [],
            counts: {},
            total: 0,
          })
          return { error: errMessage }
        }
      },
      
      selectTarget: (target) => {
        set({ selectedTarget: target })
      },
      
      setSearchQuery: (query) => {
        const filtered = filterRoutes(get().targets, query, get().activeFilter)
        set({ searchQuery: query, filteredTargets: filtered })
      },
      
      setActiveFilter: (filter) => {
        const filtered = filterRoutes(get().targets, get().searchQuery, filter)
        set({ activeFilter: filter, filteredTargets: filtered })
      },
      
      clearSelection: () => {
        set({ selectedTarget: null })
      },
      
      clearError: () => {
        set({ error: null })
      },
      
      // Trigger refetch when active connection changes
      onConnectionChange: () => {
        get().fetchTargets()
      },
    }),
    {
      name: 'dqs.targets',
      partialize: (state) => ({
        activeFilter: state.activeFilter,
        searchQuery: state.searchQuery,
      }),
    }
  )
)

// Subscribe to connection changes
if (typeof window !== 'undefined') {
  useConnectionsStore.subscribe(
    (state) => state.selectedConnectionId,
    (selectedConnectionId) => {
      if (selectedConnectionId) {
        useRoutesStore.getState().onConnectionChange()
      }
    }
  )
}