// components/profiler/MetricsGrid.jsx
import { cn } from '../../utils/classNames.js'
import { formatNumber, formatDuration } from '../../utils/formatters.js'
import { motion } from 'framer-motion'

/**
 * Metric card component matching Bento design
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
function MetricCard({
  label,
  value,
  subLabel,
  icon,
  variant = 'ok',
  className = '',
  delay = 0,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className={cn(
        'card p-4 md:p-md flex flex-col justify-center gap-2 relative overflow-hidden group',
        className
      )}
    >
      <span className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-1">
        <span className="material-symbols-outlined text-[14px]">{icon}</span>
        {label}
      </span>
      <div className="font-headline-md text-headline-md text-on-surface">{value}</div>
      {subLabel && (
        <div className="w-full bg-surface rounded-full h-1 mt-1">
          <div className="bg-tertiary h-1 rounded-full" style={{ width: subLabel }} />
        </div>
      )}
    </motion.div>
  )
}

/**
 * Metrics grid component - Bento style
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
  const statusCategory = statusCode >= 200 && statusCode < 300 ? 'ok' : statusCode >= 400 ? 'danger' : 'warn'
  const statusLabel = statusCode >= 200 && statusCode < 300 ? 'OK' : statusCode >= 400 ? 'Error' : 'Redirect'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-md mb-6">
      {/* Metric 1: HTTP Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0, ease: 'easeOut' }}
        className={cn(
          'card p-4 md:p-md flex flex-col justify-center gap-2 relative overflow-hidden group',
          statusCode >= 200 && statusCode < 300 ? 'border-t-4 border-[#2e7d32]' : ''
        )}
      >
        <span className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">check_circle</span> HTTP Status
        </span>
        <div className={cn('font-headline-md text-headline-md', statusCode >= 200 && statusCode < 300 ? 'text-[#a5d6a7]' : 'text-error')}>
          {statusCode || '—'} {statusLabel}
        </div>
      </motion.div>

      {/* Metric 2: Total Queries */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 50, ease: 'easeOut' }}
        className="card p-4 md:p-md flex flex-col justify-center gap-2 relative overflow-hidden"
      >
        <span className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">database</span> Total Queries
        </span>
        <div className="font-headline-md text-headline-md text-on-surface">{formatNumber(totalQueries)}</div>
        <div className="absolute bottom-2 right-2 w-12 h-6 border-t-2 border-r-2 border-primary rounded-tr-full opacity-50" />
      </motion.div>

      {/* Metric 3: DB Time */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 100, ease: 'easeOut' }}
        className="card p-4 md:p-md flex flex-col justify-center gap-2"
      >
        <span className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">timer</span> DB Time
        </span>
        <div className="font-headline-md text-headline-md text-on-surface">{formatDuration(dbTime)}</div>
        <div className="w-full bg-surface rounded-full h-1 mt-1">
          <div className="bg-tertiary h-1 rounded-full" style={{ width: totalTime > 0 ? `${Math.min((dbTime / totalTime) * 100, 100)}%` : '0%' }} />
        </div>
      </motion.div>

      {/* Metric 4: N+1 Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 150, ease: 'easeOut' }}
        className={cn(
          'card p-4 md:p-md flex flex-col justify-center gap-2',
          nPlusOneDetected ? 'bg-[#3b0a0a] border-error shadow-[0_0_12px_rgba(147,0,10,0.3)]' : ''
        )}
      >
        <span className={cn('font-label-caps text-label-caps flex items-center gap-1', nPlusOneDetected ? 'text-error' : 'text-on-surface-variant')}>
          <span className="material-symbols-outlined text-[14px]">{nPlusOneDetected ? 'warning' : 'check_circle'}</span> N+1 Status
        </span>
        <div className={cn('font-headline-md text-headline-md', nPlusOneDetected ? 'text-on-error-container' : 'text-[#a5d6a7]')}>
          {nPlusOneDetected ? 'Detected' : 'Clean'}
        </div>
        {nPlusOneDetected && (
          <div className="text-body-sm text-on-error-container/80 mt-1">
            {result.analysis?.length || 0} issue{result.analysis?.length !== 1 ? 's' : ''} found
          </div>
        )}
      </motion.div>
    </div>
  )
}