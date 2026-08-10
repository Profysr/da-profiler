// store/connectionsStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { getHealth } from '../api/endpoints.js'

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export const useConnectionsStore = create(
  persist(
    (set, get) => ({
      // State
      connections: [],
      activeConnectionId: null,
      testingConnection: null,
      testResult: null,
      
      // Actions
      addConnection: (name, baseUrl) => {
        const id = generateId()
        const normalizedUrl = baseUrl.replace(/\/$/, '')
        set(state => ({
          connections: [...state.connections, { id, name, baseUrl: normalizedUrl, connected: false }]
        }))
        // Auto-select first connection
        if (get().connections.length === 0) {
          set({ activeConnectionId: id })
        }
        return id
      },
      
      removeConnection: (id) => {
        set(state => {
          const newConnections = state.connections.filter(c => c.id !== id)
          let newActiveId = state.activeConnectionId
          if (state.activeConnectionId === id) {
            newActiveId = newConnections.length > 0 ? newConnections[0].id : null
          }
          return {
            connections: newConnections,
            activeConnectionId: newActiveId
          }
        })
      },
      
      updateConnection: (id, updates) => {
        set(state => ({
          connections: state.connections.map(c => c.id === id ? { ...c, ...updates } : c)
        }))
      },
      
      setActiveConnection: (id) => {
        set({ activeConnectionId: id })
      },
      
      setConnectionStatus: (id, connected) => {
        set(state => ({
          connections: state.connections.map(c => c.id === id ? { ...c, connected } : c)
        }))
      },
      
      testConnection: async (baseUrl) => {
        const normalizedUrl = baseUrl.replace(/\/$/, '')
        set({ testingConnection: normalizedUrl, testResult: null })
        try {
          const data = await getHealth(normalizedUrl)
          const success = data.debug === true && data.router_configured === true
          set({ 
            testResult: { success, data, error: success ? null : 'DEBUG=False or router not configured' },
            testingConnection: null
          })
          return { success, data }
        } catch (error) {
          set({ 
            testResult: { success: false, error: error.message || 'Connection failed' },
            testingConnection: null
          })
          return { success: false, error: error.message }
        }
      },
      
      clearTestResult: () => set({ testResult: null }),
      
      getActiveConnection: () => {
        const { connections, activeConnectionId } = get()
        return connections.find(c => c.id === activeConnectionId) || null
      },
      
      getConnection: (id) => {
        return get().connections.find(c => c.id === id) || null
      },
      
      // Load targets for active connection
      loadTargets: async () => {
        const conn = get().getActiveConnection()
        if (!conn) return { targets: [], counts: {}, total: 0 }
        
        try {
          const { getTargets } = await import('../api/endpoints.js')
          const data = await getTargets(conn.baseUrl)
          return data
        } catch (error) {
          console.error('Failed to load targets:', error)
          return { targets: [], counts: {}, total: 0 }
        }
      }
    }),
    {
      name: 'dqs.connections',
      partialize: (state) => ({
        connections: state.connections,
        activeConnectionId: state.activeConnectionId,
      }),
    }
  )
)