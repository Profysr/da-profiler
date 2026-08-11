// components/ProjectConnections.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { useConnectionsStore } from "../store/connectionsStore.js";
import {
  ChevronDown,
  Wifi,
  WifiOff,
  Plus,
  Settings,
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
    activeConnectionId,
    setActiveConnection,
    getActiveConnection,
  } = useConnectionsStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeConnection = getActiveConnection();

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
    setActiveConnection(id);
    setIsOpen(false);
  };

  if (connections.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-2 bg-surface-container border-outline-variant hover:border-primary/50 text-on-surface transition-all shadow-sm flex"
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
        className="flex items-center justify-between gap-3 px-3 py-1.5 rounded bg-surface-container border border-outline-variant hover:border-primary/50 hover:bg-surface-container-high transition-all shadow-sm group w-48 sm:w-60 text-left outline-none focus:ring-2 focus:ring-primary/30"
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="relative flex items-center justify-center">
            <span
              className={`w-2 h-2 rounded-full transition-all ${activeConnection?.connected ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-zinc-500"}`}
            />
            {activeConnection?.connected && (
              <span className="absolute w-3 h-3 rounded-full bg-emerald-400/30 animate-ping" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase font-label-caps tracking-widest text-on-surface-variant/70 leading-none mb-0.5">
              Project
            </span>
            <span className="truncate font-medium text-xs text-on-surface group-hover:text-primary transition-colors">
              {activeConnection?.name || "Select Project"}
            </span>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-on-surface-variant transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-surface-container border border-outline-variant rounded shadow-2xl py-2 z-50 animate-in fade-in-0 zoom-in-95 duration-150 backdrop-blur-xl">
          <div className="px-3 py-1.5 text-[10px] font-label-caps uppercase tracking-wider text-on-surface-variant/60 border-b border-outline-variant/50 mb-1">
            Switch Workspace
          </div>
          <div className="max-h-60 overflow-y-auto px-1 space-y-0.5">
            {connections.map((conn) => {
              const isActive = conn.id === activeConnectionId;
              return (
                <button
                  key={conn.id}
                  onClick={() => handleSelect(conn.id)}
                  className={`w-full px-2.5 py-2 text-left flex items-center gap-2.5 rounded transition-all ${isActive
                      ? "bg-primary/15 text-primary font-medium"
                      : "hover:bg-surface-variant/50 text-on-surface"
                    }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${conn.connected ? "bg-emerald-400" : "bg-zinc-500"}`}
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="truncate text-xs font-medium leading-tight">
                      {conn.name}
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-mono truncate">
                      {conn.baseUrl}
                    </span>
                  </div>
                  {isActive && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold tracking-wider">
                      ACTIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="p-1 mt-1 border-t border-outline-variant/50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                window.dispatchEvent(new CustomEvent("dqs:open-connections"));
              }}
              className="w-full px-3 py-2 text-left flex items-center gap-2 text-xs font-medium text-primary hover:bg-primary/10 rounded transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Manage Connections</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ConnectionManager({ isOpen, onClose }) {
  const {
    connections,
    activeConnectionId,
    addConnection,
    removeConnection,
    updateConnection,
    setActiveConnection,
    testConnection,
    testResult,
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

  // Pre-flight check & add connection atomically
  const handleAdd = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newName.trim() || !newUrl.trim()) return;

      // Normalise the URL the same way the store does
      const trimmedName = newName.trim();
      const normalizedUrl = newUrl.trim().replace(/\/$/, '');

      // Duplicate guard — block same name OR same URL
      const duplicate = connections.find(
        (c) =>
          c.name.toLowerCase() === trimmedName.toLowerCase() ||
          c.baseUrl.replace(/\/$/, '') === normalizedUrl,
      );
      if (duplicate) {
        setValidationError(
          duplicate.name.toLowerCase() === trimmedName.toLowerCase()
            ? `A project named "${duplicate.name}" already exists. Choose a different name.`
            : `The URL "${normalizedUrl}" is already used by "${duplicate.name}".`,
        );
        return;
      }

      setIsVerifying(true);
      setValidationError(null);

      try {
        // Test health BEFORE saving to avoid creating broken phantom endpoints
        const result = await testConnection(normalizedUrl);

        if (result.success) {
          const id = addConnection(trimmedName, normalizedUrl);
          updateConnection(id, { connected: true });
          setNewName("");
          setNewUrl("http://127.0.0.1:8000");
          clearTestResult();
        } else {
          setValidationError(
            result.error ||
            "Failed to establish connection. Ensure DEBUG=True and router is configured.",
          );
        }
      } catch (err) {
        setValidationError(
          err.message || "Network Error: Could not reach the Django server.",
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
      setActiveConnection(id);
    },
    [setActiveConnection],
  );

  const handleDelete = useCallback(
    (id) => {
      if (
        window.confirm(
          "Are you sure you want to remove this project connection?",
        )
      ) {
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
      title="Project Connections"
      size="lg"
    >
      <div className="space-y-6">
        {/* Add New Connection Form */}
        <form
          onSubmit={handleAdd}
          className="p-5 bg-surface-container border border-outline-variant rounded-xl space-y-4 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-sm text-on-surface">
              Add New Django Workspace
            </h4>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-label-caps uppercase tracking-wider text-on-surface-variant mb-1.5">
                Project Name
              </label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Core API Service"
                className="w-full bg-surface"
              />
            </div>
            <div>
              <label className="block text-xs font-label-caps uppercase tracking-wider text-on-surface-variant mb-1.5">
                Django Server URL
              </label>
              <Input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="http://127.0.0.1:8000"
                className="w-full bg-surface font-mono text-xs"
              />
            </div>
          </div>

          {validationError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-in fade-in-50">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={isVerifying}
              className="gap-2 bg-primary text-on-primary hover:opacity-90 shadow-sm transition-all flex items-center justify-center rounded"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Health...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Test & Add Connection</span>
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Global Test Result Toast if applicable */}
        {/* {testResult && !validationError && (
          <div
            className={`p-3 rounded-xl border flex items-center gap-3 ${testResult.success ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}
          >
            {testResult.success ? (
              <CheckCircle className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="flex-1 text-xs font-medium">
              {testResult.success
                ? "Connection verified & healthy!"
                : `Verification failed: ${testResult.error}`}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearTestResult}
              icon={<X className="w-4 h-4" />}
            />
          </div>
        )} */}

        {/* Connections List */}
        <div className="space-y-3">
          <div className="text-xs font-label-caps uppercase tracking-wider text-on-surface-variant">
            Configured Projects ({connections.length})
          </div>

          {connections.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-outline-variant rounded bg-surface-container/50 text-on-surface-variant">
              <WifiOff className="w-10 h-10 mx-auto mb-3 opacity-40 text-primary" />
              <p className="text-sm font-medium text-on-surface">
                No project connections configured
              </p>
              <p className="text-xs mt-1 text-on-surface-variant/70">
                Add a running Django server instance above to start profiling.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-85 overflow-y-auto pr-1">
              {connections.map((conn) => {
                const isActive = conn.id === activeConnectionId;
                const isEditing = editingId === conn.id;
                const isChecking = checkingId === conn.id;

                return (
                  <div
                    key={conn.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded border transition-all ${isActive
                        ? "bg-primary/10 border-primary/40 shadow-sm"
                        : "bg-surface-container border-outline-variant hover:border-outline"
                      }`}
                  >
                    <div
                      className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${conn.connected
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-surface-variant text-on-surface-variant"
                        }`}
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
                            placeholder="Project Name"
                            className="text-xs font-medium"
                          />
                          <Input
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            placeholder="http://localhost:8000"
                            className="text-xs font-mono"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-on-surface truncate">
                              {conn.name}
                            </span>
                            {isActive && (
                              <span className="text-[8px] px-1.5 py-px bg-primary/20 text-primary font-bold tracking-wide">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-on-surface-variant font-mono truncate mt-0.5">
                            {conn.baseUrl}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        [
                          {
                            key: "save",
                            title: "Save",
                            ariaLabel: "Save",
                            onClick: () => handleSaveEdit(conn.id),
                            icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
                          },
                          {
                            key: "cancel",
                            title: "Cancel",
                            ariaLabel: "Cancel",
                            onClick: handleCancelEdit,
                            icon: <X className="w-4 h-4 text-on-surface-variant" />,
                          },
                        ].map((btn) => (
                          <Button
                            key={btn.key}
                            variant="ghost"
                            size="sm"
                            onClick={btn.onClick}
                            icon={btn.icon}
                            title={btn.title}
                            aria-label={btn.ariaLabel}
                          />
                        ))
                      ) : (
                        [
                          {
                            key: "health-check",
                            title: "Check Health Status",
                            ariaLabel: "Check health status",
                            onClick: () => handleTestExisting(conn),
                            disabled: isChecking,
                            icon: isChecking ? (
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-on-surface-variant hover:text-emerald-400" />
                            ),
                          },
                          {
                            key: "edit",
                            title: "Edit connection",
                            ariaLabel: "Edit connection",
                            onClick: () => handleEditClick(conn),
                            icon: <Edit2 className="w-4 h-4 text-on-surface-variant hover:text-primary" />,
                          },
                          !isActive && {
                            key: "connect",
                            title: "Set as active workspace",
                            ariaLabel: "Connect",
                            onClick: () => handleConnect(conn.id),
                            icon: <Play className="w-4 h-4 text-on-surface-variant hover:text-primary" />,
                          },
                          {
                            key: "delete",
                            title: "Remove project",
                            ariaLabel: "Remove",
                            onClick: () => handleDelete(conn.id),
                            icon: <Trash2 className="w-4 h-4" />,
                            className: "text-on-surface-variant hover:text-red-400 hover:bg-red-500/10",
                          },
                        ]
                          .filter(Boolean)
                          .map((btn) => (
                            <Button
                              key={btn.key}
                              variant="ghost"
                              size="sm"
                              onClick={btn.onClick}
                              disabled={btn.disabled}
                              icon={btn.icon}
                              title={btn.title}
                              aria-label={btn.ariaLabel}
                              className={btn.className}
                            />
                          ))
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
