import { formatNumber, formatDuration } from '../../utils/formatters.js';
import { motion } from 'framer-motion';
import { MetricCard } from '../ui/MetricCard';

export function MetricsGrid({ result, "data-label": testId = "metrics-grid" }) {
  if (!result) return null;

  const metrics = result.metrics || {};
  const statusCode = result.status_code || 0;
  const totalQueries = metrics.total_queries ?? result.total_queries ?? 0;
  const dbTime = metrics.db_time_ms ?? result.total_duration_ms ?? 0;
  const nPlusOneDetected = metrics.n_plus_one_detected ?? (result.analysis?.length > 0);
  const totalTime = metrics.total_time_ms ?? result.total_duration_ms ?? 0;

  const statusLabel = statusCode >= 200 && statusCode < 300 ? 'OK' : statusCode >= 400 ? 'Error' : 'Redirect';

  const metricConfigs = [
    {
      id: 1,
      title: 'HTTP Status',
      value: `${statusCode || '—'} ${statusLabel}`,
      icon: 'check_circle',
      variant: 'success',
      delay: 0
    },
    {
      id: 2,
      title: 'Total Queries',
      value: formatNumber(totalQueries),
      icon: 'database',
      variant: 'default',
      addon: <div className="absolute bottom-2 right-2 w-12 h-6 border-t-2 border-r-2 border-primary rounded-tr-full opacity-50"></div>,
      delay: 50
    },
    {
      id: 3,
      title: 'DB Time',
      value: formatDuration(dbTime),
      icon: 'timer',
      variant: 'default',
      addon: (
        <div className="w-full bg-surface rounded-full h-1 mt-1">
          <div className="bg-tertiary h-1 rounded-full" style={{ width: totalTime > 0 ? `${Math.min((dbTime / totalTime) * 100, 100)}%` : '0%' }} />
        </div>
      ),
      delay: 100
    },
    {
      id: 4,
      title: 'N+1 Status',
      value: nPlusOneDetected ? 'Detected' : 'Clean',
      icon: nPlusOneDetected ? 'warning' : 'check_circle',
      variant: nPlusOneDetected ? 'error' : 'success',
      delay: 150
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-md" data-label={testId} data-has-result={!!result} data-n-plus-one={nPlusOneDetected}>
      {metricConfigs.map(metric => (
        <motion.div
          key={metric.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: metric.delay / 1000, ease: 'easeOut' }}
        >
          <MetricCard
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            variant={metric.variant}
            data-label={`${testId}-metric-${metric.title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {metric.addon}
          </MetricCard>
        </motion.div>
      ))}
    </div>
  );
}