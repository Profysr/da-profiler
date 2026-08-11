import {
  CheckCircle2,
  Database,
  Timer,
  AlertTriangle,
  Activity,
} from "lucide-react";

const ICON_MAP = {
  check_circle: CheckCircle2,
  database: Database,
  timer: Timer,
  warning: AlertTriangle,
  activity: Activity,
};

export function MetricCard({
  title,
  value,
  icon,
  variant = "default",
  children,
  "data-label": testId,
}) {
  const variants = {
    default:
      "bg-surface-container/40 border-outline-variant/40 hover:bg-surface-container/80 hover:border-outline-variant/80",
    success:
      "bg-success/5 border-success/20 hover:bg-success/10 hover:border-success/30",
    error:
      "bg-error/10 border-error/30 hover:bg-error/15 hover:border-error/50 shadow-[0_0_15px_rgba(255,0,0,0.03)]",
  };

  const textColors = {
    default: "text-on-surface",
    success: "text-success",
    error: "text-error",
  };

  const labelColors = {
    default: "text-on-surface-variant/80",
    success: "text-success/80",
    error: "text-error/80",
  };

  const IconComponent =
    typeof icon === "string" ? ICON_MAP[icon] || Activity : null;

  return (
    <div
      className={`h-full w-full border rounded p-3.5 flex flex-col relative overflow-hidden group transition-all duration-200 ${variants[variant] || variants.default}`}
      data-label={
        testId || `metric-card-${title.toLowerCase().replace(/\s+/g, "-")}`
      }
      data-variant={variant}
      data-title={title}
    >
      {/* Subtle light overlay on hover */}
      <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Top section: Title and Value */}
      <div className="flex flex-col gap-1 relative z-10">
        <span
          className={`font-label-caps text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-medium ${labelColors[variant] || labelColors.default}`}
          data-label="metric-label"
        >
          {IconComponent ? <IconComponent className="w-3.5 h-3.5" /> : icon}
          {title}
        </span>
        <div
          className={`text-xl md:text-2xl font-bold tracking-tight ${textColors[variant] || textColors.default}`}
          data-label="metric-value"
        >
          {value}
        </div>
      </div>

      {/* Bottom section: Addons */}
      {children && <div className="mt-auto pt-2.5 relative z-10">{children}</div>}
    </div>
  );
}