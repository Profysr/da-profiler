// src/components/UrlBar.jsx
import { MethodSelector } from "./MethodSelector.jsx";
import { useConnectionsStore } from "../store/connectionsStore.js";
import { Loader2, Send } from "lucide-react";
import { useProfileStore } from "../store/profileStore.js";
import { useRoutesStore } from "../store/routesStore.js";
import { HTTP_METHODS } from "../utils/constants.js";

export function UrlBar({
  method = "GET",
  onMethodChange,
  methods = HTTP_METHODS,
  path = "/api/testing/choose-from-sidebar/", //TODO: We can replace it with a good message as npm has
  onSend,
  loading = false,
  "data-label": testId = "url-bar",
}) {
  const { getSelectedConnection } = useConnectionsStore();
  const { selectedTarget } = useRoutesStore();
  const activeConnection = getSelectedConnection();
  const baseUrl = activeConnection?.baseUrl || "http://127.0.0.1:8000";

  const isSendDisabled =
    loading ||
    !activeConnection ||
    !selectedTarget ||
    !(selectedTarget.executable !== undefined
      ? selectedTarget.executable
      : selectedTarget.can_execute);

  return (
    <div className="flex items-center gap-3" data-label={testId}>
      <MethodSelector
        value={method}
        onChange={onMethodChange}
        methods={methods}
        data-label={`${testId}-method`}
      />

      {/* Static / Readonly URL Display Bar */}
      <div
        className="flex-1 relative flex items-center bg-surface-container-lowest border border-dialog-border rounded-lg h-10 overflow-hidden shadow-inner select-none"
        data-label={`${testId}-field-wrapper`}
      >
        <span
          className="pl-3.5 font-mono text-xs text-primary/90 border-r border-outline-variant pr-3 select-none bg-surface-container-low shrink-0 h-full flex items-center font-bold"
          title="Active Server Base URL"
        >
          {baseUrl}
        </span>
        <input
          type="text"
          value={path}
          readOnly
          tabIndex={-1}
          placeholder="/api/v1/resource/"
          className="w-full bg-transparent border-none text-on-surface font-mono text-xs px-3.5 py-2 focus:outline-none cursor-default font-semibold select-all"
          aria-label="Request URL path (Read-only)"
        />
        <span className="pr-3 text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-wider shrink-0 select-none">
          Read-only URL
        </span>
      </div>

      <button
        type="button"
        onClick={onSend}
        disabled={isSendDisabled}
        className="bg-primary text-white h-10 px-6 rounded-lg font-bold text-xs hover:opacity-90 transition-all flex items-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,108,55,0.3)] active:scale-95"
        title={
          !activeConnection
            ? "No connection selected"
            : "Send Request (Ctrl + Enter)"
        }
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            <span>Sending...</span>
          </>
        ) : (
          <>
            <span>Send</span>
            <Send size={14} />
          </>
        )}
      </button>
    </div>
  );
}
