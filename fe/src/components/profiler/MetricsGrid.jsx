// components/profiler/MetricsGrid.jsx
import { cn } from '../../utils/classNames.js'
import { formatNumber, formatDuration, getStatusColors, getStatusCategory } from '../../utils/formatters.js'
import { motion } from 'framer-motion'

/**
 * Metric card component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
function MetricCard({ 
  label, 
  value, 
  subLabel, 
  variant = 'ok', 
  trend,
  className = '',
  delay = 0,
}) {
  const variantClasses = {
    ok: 'border-t-accent-green',
    warn: 'border-t-accent-orange',
    danger: 'border-t-accent-red',
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className={cn(
        'card p-4 border-t-4',
        variantClasses[variant],
        className
      )}
    >
      <div className="text-xs font-medium text-text-secondary mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono text-text-primary">{value}</span>
        {trend && (
          <span className={cn(
            'text-xs font-medium',
            trend.positive ? 'text-accent-green' : 'text-accent-red'
          )}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      {subLabel && (
        <div className="text-xs text-text-secondary mt-1">{subLabel}</div>
      )}
    </motion.div>
  )
}

/**
 * Metrics grid component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function MetricsGrid({ result }) {
  if (!result) return null
  
  const metrics = result.metrics || {}
  const statusCode = result.status_code || 0
  const totalQueries = metrics.total_queries ?? result.total_queries ?? 0
  const dbTime = metrics.db_time_ms ?? result.total_duration_ms ?? 0
  const nPlusOneDetected = metrics.n_plus_one_detected ?? (result.analysis?.length > 0)
  const uniqueFingerprints = metrics.unique_fingerprints ?? 0
  const totalTime = metrics.total_time_ms ?? result.total_duration_ms ?? 0
  
  // Determine status colors
  const statusColors = getStatusColors(statusCode)
  const statusCategory = getStatusCategory(statusCode)
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard
        label="HTTP Status"
        value={statusCode || '—'}
        subLabel={`${statusCategory} ${statusCode ? 'OK' : 'No response'}`}
        variant={statusCode >= 200 && statusCode < 300 ? 'ok' : statusCode >= 400 ? 'danger' : 'warn'}
        delay={0}
      />
      
      <MetricCard
        label="Total Queries"
        value={formatNumber(totalQueries)}
        subLabel={`${uniqueFingerprints} unique ${uniqueFingerprints !== 1 ? 'shapes' : 'shape'}`}
        variant={totalQueries > 15 ? 'danger' : totalQueries > 5 ? 'warn' : 'ok'}
        delay={50}
      />
      
      <MetricCard
        label="DB Time"
        value={formatDuration(dbTime)}
        subLabel={formatDuration(totalTime)}
        variant={dbTime > 500 ? 'danger' : dbTime > 100 ? 'warn' : 'ok'}
        delay={100}
      />
      
      <MetricCard
        label="N+1 Status"
        value={nPlusOneDetected ? '⚠ Detected' : '✓ Clean'}
        subLabel={`${result.analysis?.length || 0} issue${result.analysis?.length !== 1 ? 's' : ''} found`}
        variant={nPlusOneDetected ? 'danger' : 'ok'}
        delay={150}
      />
    </div>
  )
}