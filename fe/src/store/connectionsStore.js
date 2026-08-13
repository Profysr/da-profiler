// store/connectionsStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getHealth, getTargets } from "../api/endpoints.js";

function generateId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const useConnectionsStore = create(
  persist(
    (set, get) => ({
      // State
      connections: [],
      selectedConnectionId: null,
      testingConnection: null,
      testResult: null,

      // Actions
      addConnection: (name, baseUrl) => {
        const id = generateId();
        const normalizedUrl = baseUrl.replace(/\/$/, "");
        set((state) => ({
          connections: [
            ...state.connections,
            { id, name, baseUrl: normalizedUrl, connected: false },
          ],
        }));
        // Auto-select first connection
        if (!get().selectedConnectionId) {
          set({ selectedConnectionId: id });
        }
        return id;
      },

      removeConnection: (id) => {
        set((state) => {
          const newConnections = state.connections.filter((c) => c.id !== id);
          let newSelectedId = state.selectedConnectionId;
          // If the removed connection was selected, pick the next one
          if (state.selectedConnectionId === id) {
            newSelectedId =
              newConnections.length > 0 ? newConnections[0].id : null;
          }
          return {
            connections: newConnections,
            selectedConnectionId: newSelectedId,
          };
        });
      },

      updateConnection: (id, updates) => {
        set((state) => ({
          connections: state.connections.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      setSelectedConnection: (id) => {
        set({ selectedConnectionId: id });
        if (id) {
          get().ensureConnectionAlive(id);
        }
      },

      setConnectionStatus: (id, connected) => {
        set((state) => ({
          connections: state.connections.map((c) =>
            c.id === id ? { ...c, connected } : c
          ),
        }));
      },

      /**
       * Checks connection health for the given connectionId or selectedConnection.
       * Automatically updates `connected` status in the store.
       * Returns standard response: { success, data, error, message, status }
       */
      ensureConnectionAlive: async (connectionId) => {
        const targetId = connectionId || get().selectedConnectionId;
        const conn =
          get().connections.find((c) => c.id === targetId) ||
          get().getSelectedConnection();

        if (!conn) {
          return {
            success: false,
            data: null,
            error: "No connection selected",
            message: "No connection selected",
            status: null,
          };
        }

        const health = await getHealth(conn.baseUrl);

        // Synchronize connection status in store
        get().setConnectionStatus(conn.id, health.success);

        return health;
      },

      /**
       * Test connection for an explicit baseUrl without modifying selected connection.
       */
      testConnection: async (baseUrl) => {
        const normalizedUrl = baseUrl.replace(/\/$/, "");
        set({ testingConnection: normalizedUrl, testResult: null });

        const health = await getHealth(normalizedUrl);

        set({
          testResult: {
            success: health.success,
            data: health.data,
            error: health.error,
          },
          testingConnection: null,
        });

        return health;
      },

      clearTestResult: () => set({ testResult: null }),

      getSelectedConnection: () => {
        const { connections, selectedConnectionId } = get();
        return connections.find((c) => c.id === selectedConnectionId) || null;
      },

      getConnection: (id) => {
        return get().connections.find((c) => c.id === id) || null;
      },

      /**
       * Ensures connection health first, then loads targets.
       */
      loadTargets: async () => {
        const conn = get().getSelectedConnection();
        if (!conn) return { targets: [], counts: {}, total: 0 };

        // 1. Ensure connection is alive FIRST
        const health = await get().ensureConnectionAlive(conn.id);

        // 2. Short-circuit if inactive or unreachable
        if (!health.success) {
          console.error("Aborting target load - connection inactive:", health.error);
          return {
            targets: [],
            counts: {},
            total: 0,
            error: health.error || "Connection inactive or unreachable",
          };
        }

        // 3. Load targets using getTargets endpoint
        const targetsResult = await getTargets(conn.baseUrl);
        if (!targetsResult.success) {
          console.error("Failed to load targets:", targetsResult.error);
          return {
            targets: [],
            counts: {},
            total: 0,
            error: targetsResult.error,
          };
        }

        return targetsResult.data;
      },
    }),
    {
      name: "dqs.connections",
      partialize: (state) => ({
        connections: state.connections,
        selectedConnectionId: state.selectedConnectionId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.selectedConnectionId) {
          state.ensureConnectionAlive(state.selectedConnectionId);
        }
      },
    }
  )
);

