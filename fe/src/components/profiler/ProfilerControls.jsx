import { Plus, Trash2 } from "lucide-react";
import {
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import {Table} from "../ui/Table";
import { TabBar } from "../ui/Tabs";

/**
 * Custom Hook: Manages state and handlers for key-value parameter lists.
 */
function useParamList(initialState = []) {
  const [params, setParams] = useState(initialState);

  const update = useCallback((id, field, value) => {
    setParams((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  }, []);

  const remove = useCallback((id) => {
    setParams((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const add = useCallback(() => {
    setParams((prev) => [...prev, { id: Date.now(), key: "", value: "" }]);
  }, []);

  const toObject = useCallback(() => {
    return params.reduce((acc, { key, value }) => {
      if (key && value !== "") acc[key] = value;
      return acc;
    }, {});
  }, [params]);

  return { params, setParams, update, remove, add, toObject };
}


/**
 * ParamTable — reusable editable key/value table for path and query params.
 * Description column intentionally omitted per UX requirements.
 */
export function ParamTable({ params, onUpdate, onDelete, onAdd, "data-label": testId = "param-table" }) {
  const columns = [
    { label: 'Key',   className: 'w-2/5' },
    { label: 'Value', className: 'w-2/5' },
    { label: '',      className: 'w-[40px]' },
  ];

  const AddButton = (
    <button
      onClick={onAdd}
      className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-primary hover:bg-primary/10 px-2.5 py-1.5 rounded transition-colors"
      data-label={`${testId}-add-btn`}
      type="button"
    >
      <Plus className="w-3.5 h-3.5" />
      Add Param
    </button>
  );

  return (
    <Table columns={columns} footerAction={AddButton} data-label={testId}>
      {params.map((param) => (
        <tr
          key={param.id}
          className="border-b border-outline-variant/40 hover:bg-surface-variant/10 transition-colors"
          data-label={`${testId}-row-${param.id}`}
          data-param-id={param.id}
        >
          {/* Key cell */}
          <td className="px-2 py-1.5" data-label={`${testId}-cell-key`}>
            <input
              className="w-full px-2 py-1 rounded border border-outline-variant bg-surface-container text-primary font-mono text-[12px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors placeholder:text-on-surface-variant/40"
              type="text"
              value={param.key}
              onChange={(e) => onUpdate(param.id, 'key', e.target.value)}
              placeholder="key"
              data-label={`${testId}-input-key-${param.id}`}
            />
          </td>

          {/* Value cell */}
          <td className="px-2 py-1.5" data-label={`${testId}-cell-value`}>
            <input
              className="w-full px-2 py-1 rounded border border-outline-variant bg-surface-container text-on-surface font-mono text-[12px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors placeholder:text-on-surface-variant/40"
              type="text"
              value={param.value}
              onChange={(e) => onUpdate(param.id, 'value', e.target.value)}
              placeholder="value"
              data-label={`${testId}-input-value-${param.id}`}
            />
          </td>

          {/* Delete button */}
          <td className="px-2 py-1.5 text-center" data-label={`${testId}-cell-delete`}>
            <button
              onClick={() => onDelete(param.id)}
              className="text-on-surface-variant hover:text-error transition-colors p-1 rounded hover:bg-error/10"
              data-label={`${testId}-delete-btn-${param.id}`}
              title="Remove param"
              type="button"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </td>
        </tr>
      ))}
    </Table>
  );
}

/**
 * Main Component
 */
export const ProfilerControls = forwardRef(function ProfilerControls(
  {
    route,
    onRun,
    loading = false,
    disabled = false,
    selectedMethod,
    "data-label": testId = "profiler-controls",
  },
  ref,
) {
  const [method, setMethod] = useState(
    selectedMethod || route?.method || "GET",
  );
  const [activeTab, setActiveTab] = useState("path");

  const pathParams = useParamList([]);
  const queryParams = useParamList([{ id: 1, key: "", value: "" }]);

  // Sync internal method when parent-controlled selectedMethod changes
  useEffect(() => {
    if (selectedMethod) setMethod(selectedMethod);
  }, [selectedMethod]);

  // Seed path params from route definition
  useEffect(() => {
    if (route) {
      if (!selectedMethod && route.method) setMethod(route.method);

      const seeded = (route.path_params || []).map((p) => ({
        id: p.name,
        key: p.name,
        value: "",
      }));

      pathParams.setParams(seeded.length > 0 ? seeded : []);
    }
  }, [route]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildPayload = useCallback(
    () => ({
      method,
      path_params: pathParams.toObject(),
      query_params: queryParams.toObject(),
    }),
    [method, pathParams, queryParams],
  );

  // Expose run() to parent via ref
  useImperativeHandle(
    ref,
    () => ({
      run: () => onRun(buildPayload()),
    }),
    [onRun, buildPayload],
  );

  // Tab items configuration for the shared TabBar component
  const tabs = [
    { id: "path", label: "Path Params", icon: "list_alt" },
    { id: "query", label: "Query Params", icon: "database" },
  ];

  return (
    <div
      className="bg-surface-container-low border-b border-outline-variant flex flex-col flex-shrink-0"
      data-label={testId}
      data-loading={loading}
      data-disabled={disabled}
    >
      {/* Standardized Tab Bar */}
      <TabBar
        tabs={tabs}
        activeTabId={activeTab}
        onTabChange={setActiveTab}
        disabled={disabled || loading}
        data-label={`${testId}-tabs`}
      />

      {/* Parameter Table Content */}
      <div className="p-4 flex flex-col gap-3">
        {activeTab === "path" && (
          <ParamTable
            params={pathParams.params}
            onUpdate={pathParams.update}
            onDelete={pathParams.remove}
            onAdd={pathParams.add}
            data-label={`${testId}-path-param-table`}
          />
        )}

        {activeTab === "query" && (
          <ParamTable
            params={queryParams.params}
            onUpdate={queryParams.update}
            onDelete={queryParams.remove}
            onAdd={queryParams.add}
            data-label={`${testId}-query-param-table`}
          />
        )}
      </div>
    </div>
  );
});