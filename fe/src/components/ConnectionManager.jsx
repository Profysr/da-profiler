// components/ConnectionManager.jsx
import { useState, useCallback } from "react";
import { useConnectionsStore } from "../store/connectionsStore.js";
import { getHealth } from "../api/endpoints.js";
import {
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  Wifi,
  WifiOff,
  Play,
} from "lucide-react";
import { Modal } from "./ui/Modal.jsx";
import { Input } from "./ui/Input.jsx";
import { Button } from "./ui/Button.jsx";

export function ConnectionManager({ isOpen, onClose }) {
  const {
    connections,
    activeConnectionId,
    addConnection,
    removeConnection,
    updateConnection,
    setActiveConnection,
    testConnection,
    testingConnection,
    testResult,
    clearTestResult,
  } = useConnectionsStore();
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [testing, setTesting] = useState(false);

  const handleAdd = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newName.trim() || !newUrl.trim()) return;
      try {
        const id = addConnection(newName.trim(), newUrl.trim());
        setNewName("");
        setNewUrl("");
        // Auto-test the new connection
        await testConnection(newUrl.trim());
        if (testResult?.success) {
          updateConnection(id, { connected: true });
        }
      } catch (err) {
        console.error("Failed to add connection:", err);
      }
    },
    [
      addConnection,
      newName,
      newUrl,
      testConnection,
      testResult,
      updateConnection,
    ],
  );

  const handleTest = useCallback(
    async (url) => {
      setTesting(true);
      await testConnection(url);
      setTesting(false);
    },
    [testConnection],
  );

  const handleConnect = useCallback(
    (id) => {
      setActiveConnection(id);
    },
    [setActiveConnection],
  );

  const handleDelete = useCallback(
    (id) => {
      if (window.confirm("Remove this project connection?")) {
        removeConnection(id);
      }
    },
    [removeConnection],
  );

  const handleEditClick = useCallback((conn) => {
    setEditingId(conn.id);
    setEditName(conn.name);
  }, []);

  const handleSaveEdit = useCallback(
    (id) => {
      if (editName.trim()) {
        updateConnection(id, { name: editName.trim() });
        setEditingId(null);
        setEditName("");
      }
    },
    [editName, updateConnection],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditName("");
  }, []);

  const handleTestResultClose = useCallback(() => {
    clearTestResult();
  }, [clearTestResult]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Project Connections"
      size="lg"
    >
      <div className="space-y-4">
        {/* Add New Connection Form */}
        <form
          onSubmit={handleAdd}
          className="p-4 bg-surface rounded-lg border border-outline-variant space-y-3"
        >
          <h4 className="font-medium text-on-surface">Add Project</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">
                Project Name
              </label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="My Django App"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">
                Django URL
              </label>
              <Input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="http://localhost:8000"
                className="w-full"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full sm:w-auto"
            icon={<Plus className="w-4 h-4" />}
          >
            Add Connection
          </Button>
        </form>

        {/* Test Result Toast */}
        {testResult && (
          <div
            className={`p-3 rounded-lg border flex items-center gap-3 ${testResult.success ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}
          >
            {testResult.success ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="flex-1 text-sm">
              {testResult.success
                ? "Connection successful!"
                : `Failed: ${testResult.error}`}
              {testResult.data && (
                <span className="ml-2 font-mono text-xs opacity-70">
                  ({testResult.data.status})
                </span>
              )}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTestResultClose}
              icon={<X className="w-4 h-4" />}
            />
          </div>
        )}

        {/* Connections List */}
        {connections.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant">
            <WifiOff className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No project connections yet</p>
            <p className="text-xs mt-1">
              Add a Django project to start profiling
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {connections.map((conn) => (
              <div
                key={conn.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  conn.id === activeConnectionId
                    ? "bg-primary/5 border-primary/30"
                    : "bg-surface border-outline-variant hover:bg-surface-container-high"
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${conn.connected ? "bg-green-500/20 text-green-400" : "bg-surface-variant text-on-surface-variant"}`}
                >
                  {conn.connected ? (
                    <Wifi className="w-4 h-4" />
                  ) : (
                    <WifiOff className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {editingId === conn.id ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSaveEdit(conn.id)
                      }
                      onBlur={handleCancelEdit}
                      autoFocus
                      className="text-sm font-medium"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-on-surface truncate">
                        {conn.name}
                      </span>
                      {conn.id === activeConnectionId && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                          Active
                        </span>
                      )}
                    </div>
                  )}
                  <span className="text-xs text-on-surface-variant font-mono truncate block">
                    {conn.baseUrl}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {editingId === conn.id ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSaveEdit(conn.id)}
                        icon={<CheckCircle className="w-4 h-4" />}
                        aria-label="Save"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        icon={<X className="w-4 h-4" />}
                        aria-label="Cancel"
                      />
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(conn)}
                        icon={<Edit2 className="w-4 h-4" />}
                        aria-label="Edit name"
                      />
                      {conn.id !== activeConnectionId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleConnect(conn.id)}
                          icon={<Play className="w-4 h-4" />}
                          aria-label="Connect"
                        />
                      )}
                      {conn.connected && conn.id !== activeConnectionId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTest(conn.baseUrl)}
                          disabled={testing === conn.baseUrl}
                          icon={
                            testing === conn.baseUrl ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )
                          }
                          aria-label="Test connection"
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(conn.id)}
                        icon={<Trash2 className="w-4 h-4" />}
                        aria-label="Remove"
                        className="text-error hover:bg-error/10"
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
