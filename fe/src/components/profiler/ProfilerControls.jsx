// components/profiler/ProfilerControls.jsx
import { useState, useEffect, useCallback } from 'react'
import { cn } from '../../utils/classNames.js'
import { CONVERTER_PLACEHOLDERS } from '../../utils/constants.js'

/**
 * Profiler controls component matching the design
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function ProfilerControls({
  route,
  onRun,
  loading = false,
  disabled = false
}) {
  const [method, setMethod] = useState('GET')
  const [seedCount, setSeedCount] = useState(5)
  const [pathParams, setPathParams] = useState({})
  const [queryParams, setQueryParams] = useState([{ key: '', value: '' }])
  const [activeTab, setActiveTab] = useState('path')

  // Initialize path params from route
  useEffect(() => {
    if (route?.path_params) {
      const initialParams = {}
      route.path_params.forEach((param) => {
        initialParams[param.name] = ''
      })
      setPathParams(initialParams)
    }
  }, [route])

  const handlePathParamChange = useCallback((name, value) => {
    setPathParams((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleQueryParamChange = useCallback((index, field, value) => {
    setQueryParams((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }, [])

  const addQueryParam = useCallback(() => {
    setQueryParams((prev) => [...prev, { key: '', value: '' }])
  }, [])

  const removeQueryParam = useCallback((index) => {
    setQueryParams((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const addPathParam = useCallback(() => {
    // This would need route context to know what params are available
    // For now, we'll just add a placeholder
  }, [])

  const handleRun = useCallback(() => {
    const pathParamsObj = {}
    Object.entries(pathParams).forEach(([key, value]) => {
      if (value !== '') pathParamsObj[key] = value
    })

    const queryParamsObj = {}
    queryParams.forEach((param) => {
      if (param.key && param.value) {
        queryParamsObj[param.key] = param.value
      }
    })

    onRun({
      method,
      seed_count: seedCount,
      path_params: pathParamsObj,
      query_params: queryParamsObj,
    })
  }, [method, seedCount, pathParams, queryParams, onRun])

  const pathParamsList = route?.path_params || []

  return (
    <div className="bg-surface-container p-4 md:p-md rounded border border-outline-variant flex flex-col md:flex-row md:flex-wrap items-start md:items-end gap-4 md:gap-md shadow-sm flex-shrink-0">
      <div className="flex flex-col gap-4 w-full flex-1">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <button
              className={cn('font-label-caps text-label-caps pb-1 whitespace-nowrap transition-colors', activeTab === 'path' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface')}
              onClick={() => setActiveTab('path')}
              disabled={disabled || loading}
            >
              Path Params
            </button>
            <button
              className={cn('font-label-caps text-label-caps pb-1 whitespace-nowrap transition-colors', activeTab === 'query' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface')}
              onClick={() => setActiveTab('query')}
              disabled={disabled || loading}
            >
              Query Params
            </button>
          </div>
        </div>

        <div className="border border-outline-variant rounded overflow-hidden bg-surface overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-surface-variant/50 border-b border-outline-variant">
                <th className="px-4 py-2 font-label-caps text-label-caps text-on-surface-variant w-1/4">Key</th>
                <th className="px-4 py-2 font-label-caps text-label-caps text-on-surface-variant w-1/4">Value</th>
                <th className="px-4 py-2 font-label-caps text-label-caps text-on-surface-variant w-auto">Description</th>
                <th className="px-4 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="font-code-sm text-code-sm">
              {activeTab === 'path' ? (
                pathParamsList.length > 0 ? (
                  pathParamsList.map((param) => (
                    <tr key={param.name} className="border-b border-outline-variant/50">
                      <td className="px-4 py-2">
                        <input
                          className="input bg-transparent border-none outline-none text-primary font-code-sm w-full p-0 focus:ring-0"
                          type="text"
                          value={param.name}
                          readOnly
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          className="input bg-transparent border-none outline-none text-on-surface font-code-sm w-full p-0 focus:ring-0"
                          type="text"
                          value={pathParams[param.name] || ''}
                          onChange={(e) => handlePathParamChange(param.name, e.target.value)}
                          placeholder={CONVERTER_PLACEHOLDERS[param.converter] || CONVERTER_PLACEHOLDERS.default}
                          disabled={disabled || loading}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          className="input bg-transparent border-none outline-none text-on-surface-variant font-code-sm w-full p-0 focus:ring-0"
                          type="text"
                          value={param.description || `${param.converter} parameter`}
                          readOnly
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button className="material-symbols-outlined text-on-surface-variant hover:text-error text-[18px]" disabled>delete</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-2 text-on-surface-variant" colSpan={4}>No path parameters required</td>
                  </tr>
                )
              ) : (
                queryParams.map((param, index) => (
                  <tr key={index} className="border-b border-outline-variant/50">
                    <td className="px-4 py-2">
                      <input
                        className="input bg-transparent border-none outline-none text-on-surface font-code-sm w-full p-0 focus:ring-0"
                        type="text"
                        value={param.key}
                        onChange={(e) => handleQueryParamChange(index, 'key', e.target.value)}
                        placeholder="Key (e.g., page, limit)"
                        disabled={disabled || loading}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className="input bg-transparent border-none outline-none text-on-surface font-code-sm w-full p-0 focus:ring-0"
                        type="text"
                        value={param.value}
                        onChange={(e) => handleQueryParamChange(index, 'value', e.target.value)}
                        placeholder="Value"
                        disabled={disabled || loading}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className="input bg-transparent border-none outline-none text-on-surface-variant font-code-sm w-full p-0 focus:ring-0"
                        type="text"
                        placeholder="Description"
                        disabled
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        className="material-symbols-outlined text-on-surface-variant hover:text-error text-[18px]"
                        onClick={() => removeQueryParam(index)}
                        disabled={disabled || loading || queryParams.length === 1}
                      >
                        delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="p-2 bg-surface-container-low border-t border-outline-variant">
            <button
              className="flex items-center gap-1 font-label-caps text-label-caps text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors"
              onClick={activeTab === 'query' ? addQueryParam : addPathParam}
              disabled={disabled || loading}
            >
              <span className="material-symbols-outlined text-[16px]">add</span> Add Param
            </button>
          </div>
        </div>
      </div>

      <button
        className="btn-success px-6 py-2 rounded font-label-caps text-label-caps flex items-center justify-center gap-2 transition-all w-full md:w-auto"
        onClick={handleRun}
        disabled={disabled || loading}
      >
        <span className="material-symbols-outlined text-[18px]">play_arrow</span> Execute & Profile
      </button>
    </div>
  )
}