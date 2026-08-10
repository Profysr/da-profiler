import { N1AlertCard } from './N1AlertCard.jsx';
import { CheckCircle2 } from 'lucide-react';

export default function SummaryPanel({ result, "data-label": testId = "summary-panel" }) {
  if (!result) return null;

  const analysis = result?.analysis || [];
  const nPlusOneDetected = analysis.length > 0;

  if (!nPlusOneDetected) {
    return (
      <div className="p-4 md:p-md bg-surface-container border border-outline-variant rounded-lg flex flex-col justify-center gap-2" data-label={`${testId}-clean`} data-n-plus-one={false}>
        <span className="font-label-caps text-xs text-on-surface-variant flex items-center gap-1.5 font-medium" data-label={`${testId}-status-label`}>
          <CheckCircle2 className="w-4 h-4 text-success" /> N+1 Status
        </span>
        <div className="font-headline-md text-headline-md text-[#a5d6a7] font-semibold" data-label={`${testId}-status-value`}>Clean</div>
        <div className="w-full bg-surface rounded-full h-1 mt-1" data-label={`${testId}-progress-bar`}>
          <div className="bg-success h-1 rounded-full w-full" data-label={`${testId}-progress-fill`} />
        </div>
        <p className="font-body-sm text-xs text-on-surface-variant mt-2" data-label={`${testId}-description`}>
          No N+1 issues detected. All query patterns look healthy for this endpoint.
        </p>
      </div>
    );
  }

  const firstAnalysis = analysis[0];
  const traces = firstAnalysis?.source_location
    ? [firstAnalysis.source_location, firstAnalysis.sample_queries?.[0]].filter(Boolean)
    : [];

  return (
    <div className="p-4 md:p-md bg-surface flex-1 flex flex-col gap-4 md:gap-md overflow-y-auto" data-label={testId} data-n-plus-one={true}>
      <N1AlertCard
        title="Redundant Query Loop Detected"
        loopLocation="UserSerializer:14"
        queryCount={firstAnalysis?.count || 10}
        targetTable="'roles'"
        traces={traces}
        onViewSql={() => { }}
        onGenerateFix={() => { }}
        data-label={`${testId}-n1-alert`}
      />
    </div>
  );
}