import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { cn } from '../../utils/classNames.js';
import { ParamTable } from '../ui/Table.jsx';

/**
 * ProfilerControls — Path/Query param editor.
 * Exposes a `run()` method via ref so the parent (ProfilerPanel) can trigger
 * execution from the header's Execute button while keeping param state here.
 */
export const ProfilerControls = forwardRef(function ProfilerControls({
  route,
  onRun,
  loading = false,
  disabled = false,
  selectedMethod,
  "data-label": testId = "profiler-controls"
}, ref) {
  const [method, setMethod] = useState(selectedMethod || route?.method || 'GET');
  const [seedCount, setSeedCount] = useState(5);
  // Path params: [{id, key, value}] — starts from route definition, user can add more
  const [pathParamRows, setPathParamRows] = useState([]);
  const [queryParams, setQueryParams] = useState([{ id: 1, key: '', value: '' }]);
  const [activeTab, setActiveTab] = useState('path');

  // Sync internal method when parent-controlled selectedMethod changes (header pill switch)
  useEffect(() => {
    if (selectedMethod) setMethod(selectedMethod);
  }, [selectedMethod]);

  useEffect(() => {
    if (route) {
      if (!selectedMethod && route.method) setMethod(route.method);
      // Seed path param rows from route definition
      const seeded = (route.path_params || []).map((p) => ({
        id: p.name,
        key: p.name,
        value: '',
      }));
      setPathParamRows(seeded.length > 0 ? seeded : []);
    }
  }, [route]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePathParamChange = useCallback((id, field, value) => {
    setPathParamRows((prev) => prev.map((p) => p.id === id ? { ...p, [field]: value } : p));
  }, []);

  const removePathParam = useCallback((id) => {
    setPathParamRows((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addPathParam = useCallback(() => {
    setPathParamRows((prev) => [...prev, { id: Date.now(), key: '', value: '' }]);
  }, []);

  const addQueryParam = useCallback(() => {
    setQueryParams((prev) => [...prev, { id: Date.now(), key: '', value: '' }]);
  }, []);

  const removeQueryParam = useCallback((id) => {
    setQueryParams((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateQueryParam = useCallback((id, field, newValue) => {
    setQueryParams((prev) => prev.map(p => (p.id === id ? { ...p, [field]: newValue } : p)));
  }, []);

  const buildPayload = useCallback(() => {
    const pathParamsObj = {};
    pathParamRows.forEach(({ key, value }) => {
      if (key && value !== '') pathParamsObj[key] = value;
    });
    const queryParamsObj = {};
    queryParams.forEach(({ key, value }) => {
      if (key && value) queryParamsObj[key] = value;
    });
    return { method, seed_count: seedCount, path_params: pathParamsObj, query_params: queryParamsObj };
  }, [method, seedCount, pathParamRows, queryParams]);

  // Expose run() to parent via ref — so the Execute button in the header can fire it
  useImperativeHandle(ref, () => ({
    run: () => onRun(buildPayload()),
  }), [onRun, buildPayload]);

  // pathParamRows is already in the right shape for ParamTable

  return (
    <div className="bg-surface-container-low border-b border-outline-variant px-4 py-3 flex flex-col gap-3 flex-shrink-0" data-label={testId} data-loading={loading} data-disabled={disabled}>
      {/* Param Tabs */}
      <div className="flex items-center gap-6 border-b border-outline-variant pb-2" data-label={`${testId}-param-tabs`}>
        <button
          className={cn('font-label-caps text-xs pb-1 whitespace-nowrap transition-colors font-semibold', activeTab === 'path' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface')}
          onClick={() => setActiveTab('path')}
          disabled={disabled || loading}
          data-label={`${testId}-tab-path`}
          data-active={activeTab === 'path'}
        >
          Path Params
        </button>
        <button
          className={cn('font-label-caps text-xs pb-1 whitespace-nowrap transition-colors font-semibold', activeTab === 'query' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface')}
          onClick={() => setActiveTab('query')}
          disabled={disabled || loading}
          data-label={`${testId}-tab-query`}
          data-active={activeTab === 'query'}
        >
          Query Params
        </button>
      </div>

      {/* Param Table */}
      {activeTab === 'path' ? (
        <ParamTable
          params={pathParamRows}
          onUpdate={handlePathParamChange}
          onDelete={removePathParam}
          onAdd={addPathParam}
          data-label={`${testId}-path-param-table`}
        />
      ) : (
        <ParamTable
          params={queryParams}
          onUpdate={updateQueryParam}
          onDelete={removeQueryParam}
          onAdd={addQueryParam}
          data-label={`${testId}-query-param-table`}
        />
      )}
    </div>
  );
});