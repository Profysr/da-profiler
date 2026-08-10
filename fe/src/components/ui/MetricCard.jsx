import { CheckCircle2, Database, Timer, AlertTriangle, Activity } from 'lucide-react';

const ICON_MAP = {
  check_circle: CheckCircle2,
  database: Database,
  timer: Timer,
  warning: AlertTriangle,
  activity: Activity,
};

export function MetricCard({ title, value, icon, variant = 'default', children, "data-label": testId }) {
  const variants = {
    default: "bg-surface-container border border-outline-variant",
    success: "bg-surface-container border border-outline-variant",
    error: "bg-[#3b0a0a] border border-error shadow-glow-error"
  };

  const textColors = {
    default: "text-on-surface",
    success: "text-[#a5d6a7]",
    error: "text-on-error-container"
  };

  const labelColors = {
    default: "text-on-surface-variant",
    success: "text-on-surface-variant",
    error: "text-error"
  };

  const IconComponent = typeof icon === 'string' ? (ICON_MAP[icon] || Activity) : null;

  return (
    <div className={`${variants[variant] || variants.default} rounded-lg p-4 md:p-md flex flex-col justify-center gap-2 relative overflow-hidden group`} data-label={testId || `metric-card-${title.toLowerCase().replace(/\s+/g, '-')}`} data-variant={variant} data-title={title}>
      <span className={`font-label-caps text-label-caps flex items-center gap-1.5 ${labelColors[variant] || labelColors.default}`} data-label="metric-label">
        {IconComponent ? <IconComponent className="w-3.5 h-3.5" /> : icon}
        {title}
      </span>
      <div className={`font-headline-md text-headline-md font-semibold ${textColors[variant] || textColors.default}`} data-label="metric-value">
        {value}
      </div>
      {children}
    </div>
  );
}