import { useState, useEffect, useCallback } from 'react';
import { cn } from '../../utils/classNames.js';
import { ParamTable } from '../ui/Table.jsx';
import { Play } from 'lucide-react';

export function ProfilerControls({
  route,
  onRun,
  loading = false,
  disabled = false,
  "data-label": testId = "profiler-controls"
}) {
  const [method, setMethod] = useState(route?.method || 'GET');
  const [seedCount, setSeedCount] = useState(5);
  const [pathParams, setPathParams] = useState({});
  const [queryParams, setQueryParams] = useState([{ id: 1, key: '', value: '', desc: '' }]);
  const [activeTab, setActiveTab] = useState('path');

  useEffect(() => {
    if (route) {
      if (route.method) setMethod(route.method);
      if (route.path_params) {
        const initialParams = {};
        route.path_params.forEach((param) => {
          initialParams[param.name] = '';
        });
        setPathParams(initialParams);
      }
    }
  }, [route]);

  const handlePathParamChange = useCallback((name, value) => {
    setPathParams((prev) => ({ ...prev, [name]: value }));
  }, []);

  const addPathParam = useCallback(() => { }, []);

  const addQueryParam = useCallback(() => {
    setQueryParams((prev) => [...prev, { id: Date.now(), key: '', value: '', desc: '' }]);
  }, []);

  const removeQueryParam = useCallback((id) => {
    setQueryParams((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateQueryParam = useCallback((id, field, newValue) => {
    setQueryParams((prev) => prev.map(p => (p.id === id ? { ...p, [field]: newValue } : p)));
  }, []);

  const handleRun = useCallback(() => {
    const pathParamsObj = {};
    Object.entries(pathParams).forEach(([key, value]) => {
      if (value !== '') pathParamsObj[key] = value;
    });

    const queryParamsObj = {};
    queryParams.forEach((param) => {
      if (param.key && param.value) {
        queryParamsObj[param.key] = param.value;
      }
    });

    onRun({
      method,
      seed_count: seedCount,
      path_params: pathParamsObj,
      query_params: queryParamsObj,
    });
  }, [method, seedCount, pathParams, queryParams, onRun]);

  const pathParamsList = route?.path_params || [];

  const pathParamsForTable = pathParamsList.map(param => ({
    id: param.name,
    key: param.name,
    value: pathParams[param.name] || '',
    desc: param.description || `${param.converter || 'path'} parameter`
  }));

  return (
    <div className="bg-surface-container p-4 md:p-md rounded-lg border border-outline-variant flex flex-col md:flex-row md:flex-wrap items-start md:items-end gap-4 md:gap-md shadow-sm flex-shrink-0" data-label={testId} data-loading={loading} data-disabled={disabled}>
      <div className="flex flex-col gap-3 w-full flex-1" data-label={`${testId}-params-section`}>
        {/* Param Tabs */}
        <div className="flex items-center justify-between border-b border-outline-variant pb-2" data-label={`${testId}-param-tabs`}>
          <div className="flex gap-4">
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
        </div>

        {/* Param Table */}
        {activeTab === 'path' ? (
          <ParamTable
            params={pathParamsForTable}
            onUpdate={(id, field, value) => handlePathParamChange(id, value)}
            onDelete={() => { }}
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

      {/* Execute Button */}
      <button
        className="bg-[#2e7d32] hover:bg-[#388e3c] text-white border border-[#1b5e20] px-6 py-2.5 rounded-md font-label-caps text-xs flex items-center justify-center gap-2 transition-all shadow-success-glow hover:shadow-success-glow-hover w-full md:w-auto font-bold tracking-wider"
        onClick={handleRun}
        disabled={disabled || loading}
        data-label={`${testId}-execute-btn`}
        data-loading={loading}
      >
        <Play className="w-4 h-4 fill-white" />
        Execute & Profile
      </button>
    </div>
  );
}