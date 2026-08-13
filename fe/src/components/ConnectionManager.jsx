import { useState, useRef, useEffect, useCallback } from "react";
import { useConnectionsStore } from "../store/connectionsStore.js";
import {
  ChevronDown,
  Wifi,
  WifiOff,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  Play,
  Server,
} from "lucide-react";
import { Modal } from "./ui/Modal.jsx";
import { Input } from "./ui/Input.jsx";
import { Button } from "./ui/Button.jsx";

export function ProjectSelector() {
  const {
    connections,
    selectedConnectionId,
    setSelectedConnection,
    getSelectedConnection,
  } = useConnectionsStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeConnection = getSelectedConnection();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id) => {
    setSelectedConnection(id);
    setIsOpen(false);
  };

  if (connections.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-2 bg-surface-container-high border-dialog-border hover:border-primary/50 text-on-surface transition-all shadow-sm flex"
        onClick={() =>
          window.dispatchEvent(new CustomEvent("dqs:open-connections"))
        }
      >
        <Plus className="w-4 h-4 text-primary" />
        <span className="font-medium text-xs tracking-wide">Add Project</span>
      </Button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="flex items-center justify-between gap-3 px-3 py-1.5 rounded bg-surface-container-high border border-dialog-border hover:border-primary/50 transition-all group w-full text-left outline-none"
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="relative flex items-center justify-center">
            <span
              className={`w-2 h-2 rounded-full transition-all ${activeConnection?.connected ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-red-500"}`}
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] uppercase font-mono text-on-surface-variant/70 leading-none mb-0.5">
              WORKSPACE
            </span>
            <span className="truncate font-semibold text-xs text-on-surface group-hover:text-primary transition-colors">
              {activeConnection?.name || "Select Project"}
            </span>
          </div>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-on-surface-variant transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="relative mt-2 w-full bg-surface-container-high border border-dialog-border rounded py-2">
          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-on-surface-variant/60 border-b border-outline-variant mb-1">
            Switch Workspace
          </div>
          <div className="max-h-60 overflow-y-auto px-1 space-y-0.5">
            {connections.map((conn) => {
              const isActive = conn.id === selectedConnectionId;
              return (
                <button
                  key={conn.id}
                  onClick={() => handleSelect(conn.id)}
                  className={`w-full px-2.5 py-2 text-left flex items-center gap-2.5 rounded transition-all ${
                    isActive
                      ? "bg-primary/15 text-primary font-medium"
                      : "hover:bg-surface-container-highest text-on-surface"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${conn.connected ? "bg-emerald-400" : "bg-zinc-500"}`}
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="truncate text-xs font-semibold leading-tight">
                      {conn.name}
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-mono truncate">
                      {conn.baseUrl}
                    </span>
                  </div>
                  {isActive && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">
                      ACTIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function ConnectionManager({ isOpen, onClose }) {
  const {
    connections,
    selectedConnectionId,
    addConnection,
    removeConnection,
    updateConnection,
    setSelectedConnection,
    testConnection,
    clearTestResult,
  } = useConnectionsStore();

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("http://127.0.0.1:8000");
  const [isVerifying, setIsVerifying] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [checkingId, setCheckingId] = useState(null);

  const handleAdd = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newName.trim() || !newUrl.trim()) return;

      const trimmedName = newName.trim();
      const normalizedUrl = newUrl.trim().replace(/\/$/, "");

      const duplicate = connections.find(
        (c) =>
          c.name.toLowerCase() === trimmedName.toLowerCase() ||
          c.baseUrl.replace(/\/$/, "") === normalizedUrl,
      );
      if (duplicate) {
        setValidationError(
          duplicate.name.toLowerCase() === trimmedName.toLowerCase()
            ? `A project named "${duplicate.name}" already exists.`
            : `The URL "${normalizedUrl}" is already used by "${duplicate.name}".`,
        );
        return;
      }

      setIsVerifying(true);
      setValidationError(null);

      try {
        const result = await testConnection(normalizedUrl);
        if (result.success) {
          const id = addConnection(trimmedName, normalizedUrl);
          updateConnection(id, { connected: true });
          setNewName("");
          setNewUrl("http://127.0.0.1:8000");
          clearTestResult();
        } else {
          setValidationError(
            result.error || "Failed to connect to Django server.",
          );
        }
      } catch (err) {
        setValidationError(
          err.message || "Network Error: Could not reach server.",
        );
      } finally {
        setIsVerifying(false);
      }
    },
    [
      newName,
      newUrl,
      connections,
      testConnection,
      addConnection,
      updateConnection,
      clearTestResult,
    ],
  );

  const handleTestExisting = useCallback(
    async (conn) => {
      setCheckingId(conn.id);
      const result = await testConnection(conn.baseUrl);
      updateConnection(conn.id, { connected: result.success });
      setCheckingId(null);
    },
    [testConnection, updateConnection],
  );

  const handleConnect = useCallback(
    (id) => {
      setSelectedConnection(id);
    },
    [setSelectedConnection],
  );

  const handleDelete = useCallback(
    (id) => {
      if (window.confirm("Remove this backend connection?")) {
        removeConnection(id);
      }
    },
    [removeConnection],
  );

  const handleEditClick = useCallback((conn) => {
    setEditingId(conn.id);
    setEditName(conn.name);
    setEditUrl(conn.baseUrl);
  }, []);

  const handleSaveEdit = useCallback(
    (id) => {
      if (editName.trim() && editUrl.trim()) {
        updateConnection(id, {
          name: editName.trim(),
          baseUrl: editUrl.trim(),
        });
        setEditingId(null);
        setEditName("");
        setEditUrl("");
      }
    },
    [editName, editUrl, updateConnection],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditName("");
    setEditUrl("");
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Backend Connections"
      size="lg"
    >
      <div className="space-y-6 bg-dialog">
        <form
          onSubmit={handleAdd}
          className="p-5 bg-surface-container-high border border-dialog-border rounded-xl space-y-4 shadow-md relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" />
            <h4 className="font-bold text-xs text-on-surface">
              Register New Django Backend Connection
            </h4>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-mono uppercase text-on-surface-variant mb-1">
                Project Name
              </label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Core API Service"
                className="w-full bg-surface-container-lowest border-dialog-border text-xs text-on-surface"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-on-surface-variant mb-1">
                Django Server URL
              </label>
              <Input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="http://127.0.0.1:8000"
                className="w-full bg-surface-container-lowest border-dialog-border font-mono text-xs text-on-surface"
              />
              <p className="mt-1 text-[10px] text-on-surface-variant/70 font-mono">
                Host + port only (no trailing slash, no /profiler — the client
                adds it automatically). Any port works: 8000, 8001, 8003, etc.
              </p>
            </div>
          </div>

          {validationError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={isVerifying}
              className="gap-2 bg-primary text-white hover:opacity-90 transition-all text-xs font-semibold rounded px-4 py-2"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Testing Connection...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Test & Save Connection</span>
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="space-y-3">
          <div className="text-[10px] font-mono uppercase text-on-surface-variant">
            Registered Backend Projects ({connections.length})
          </div>

          {connections.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-dialog-border rounded-xl bg-surface-container-high text-on-surface-variant">
              <WifiOff className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
              <p className="text-xs font-medium text-on-surface">
                No active connections configured
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {connections.map((conn) => {
                const isActive = conn.id === selectedConnectionId;
                const isEditing = editingId === conn.id;
                const isChecking = checkingId === conn.id;

                return (
                  <div
                    key={conn.id}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${
                      isActive
                        ? "bg-primary/10 border-primary/40"
                        : "bg-surface-container-high border-dialog-border hover:border-outline"
                    }`}
                  >
                    <div
                      className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${conn.connected ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
                    >
                      {conn.connected ? (
                        <Wifi className="w-4 h-4" />
                      ) : (
                        <WifiOff className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-2 py-1">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="text-xs font-medium bg-surface-container-lowest"
                          />
                          <Input
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            className="text-xs font-mono bg-surface-container-lowest"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-on-surface truncate">
                              {conn.name}
                            </span>
                            {isActive && (
                              <span className="text-[8px] px-1.5 py-0.5 bg-primary/20 text-primary font-bold rounded">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-on-surface-variant font-mono truncate mt-0.5">
                            {conn.baseUrl}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveEdit(conn.id)}
                            icon={
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            }
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                            icon={
                              <X className="w-4 h-4 text-on-surface-variant" />
                            }
                          />
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTestExisting(conn)}
                            disabled={isChecking}
                            icon={
                              isChecking ? (
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-on-surface-variant hover:text-emerald-400" />
                              )
                            }
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(conn)}
                            icon={
                              <Edit2 className="w-4 h-4 text-on-surface-variant hover:text-primary" />
                            }
                          />
                          {!isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleConnect(conn.id)}
                              icon={
                                <Play className="w-4 h-4 text-on-surface-variant hover:text-primary" />
                              }
                            />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(conn.id)}
                            icon={
                              <Trash2 className="w-4 h-4 text-on-surface-variant hover:text-red-400" />
                            }
                          />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
