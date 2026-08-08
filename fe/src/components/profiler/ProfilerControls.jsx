// components/profiler/ProfilerControls.jsx
import { useState, useMemo, useCallback } from 'react'
import { Plus, Trash2, Key, Search } from 'lucide-react'
import { cn } from '../../utils/classNames.js'
import { Input } from '../ui/Input.jsx'
import { Select } from '../ui/Select.jsx'
import { Button } from '../ui/Button.jsx'
import { CONVERTER_PLACEHOLDERS } from '../../utils/constants.js'

/**
 * Profiler controls component
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
  
  // Initialize path params from route
  useMemo(() => {
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
  
  const methods = route?.methods || ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  const pathParamsList = route?.path_params || []
  
  return (
    <div className="p-4 bg-bg-secondary border-b border-border space-y-4">
      {/* Method Select */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          HTTP Method
        </label>
        <Select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          options={methods.map((m) => ({ value: m, label: m }))}
          disabled={disabled || loading}
          className="w-full max-w-xs"
        />
      </div>
      
      {/* Path Parameters */}
      {pathParamsList.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5 flex items-center gap-1.5">
            <Key className="h-4 w-4" aria-hidden="true" />
            Path Parameters
          </label>
          <div className="space-y-2">
            {pathParamsList.map((param) => (
              <div key={param.name} className="flex items-center gap-2">
                <span className="text-xs text-text-secondary font-mono w-24 truncate">
                  {param.name}
                </span>
                <span className="text-xs text-text-secondary/60 px-2 py-0.5 bg-bg-tertiary rounded">
                  {param.converter}
                </span>
                <Input
                  value={pathParams[param.name] || ''}
                  onChange={(e) => handlePathParamChange(param.name, e.target.value)}
                  placeholder={CONVERTER_PLACEHOLDERS[param.converter] || CONVERTER_PLACEHOLDERS.default}
                  disabled={disabled || loading}
                  className="flex-1"
                  aria-label={`Path parameter ${param.name}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Query Parameters */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-medium text-text-secondary flex items-center gap-1.5">
            <Search className="h-4 w-4" aria-hidden="true" />
            Query Parameters
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={addQueryParam}
            disabled={disabled || loading}
            aria-label="Add query parameter"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
        <div className="space-y-2">
          {queryParams.map((param, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={param.key}
                onChange={(e) => handleQueryParamChange(index, 'key', e.target.value)}
                placeholder="Key (e.g., page, limit)"
                disabled={disabled || loading}
                className="w-1/2"
                aria-label={`Query parameter key ${index + 1}`}
              />
              <Input
                value={param.value}
                onChange={(e) => handleQueryParamChange(index, 'value', e.target.value)}
                placeholder="Value"
                disabled={disabled || loading}
                className="w-1/2"
                aria-label={`Query parameter value ${index + 1}`}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeQueryParam(index)}
                disabled={disabled || loading || queryParams.length === 1}
                aria-label="Remove query parameter"
              >
                <Trash2 className="h-3.5 w-3.5 text-accent-red" aria-hidden="true" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Seed Count */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          Seed Data Count
        </label>
        <Input
          type="number"
          value={seedCount}
          onChange={(e) => setSeedCount(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
          min={0}
          max={100}
          disabled={disabled || loading}
          className="w-full max-w-xs"
          aria-label="Seed data count"
        />
      </div>
      
      {/* Run Button */}
      <div className="pt-2">
        <Button
          variant="primary"
          size="lg"
          onClick={handleRun}
          loading={loading}
          disabled={disabled || loading}
          className="w-full"
          id="run-profile-btn"
        >
          Profile Route
        </Button>
      </div>
    </div>
  )
}