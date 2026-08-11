import { CheckCircle2, AlertTriangle } from "lucide-react";

export function N1AlertCard({
  title = "Redundant Query Loop Detected",
  loopLocation = "UserSerializer:14",
  queryCount = 10,
  targetTable = "'roles'",
  traces = [],
  "data-label": testId = "n1-alert-card",
}) {
  return (
    <div
      className="bg-error-container/10 border border-error/50 rounded p-3 flex gap-3 items-start"
      data-label={testId}
      data-title={title}
      data-loop-location={loopLocation}
      data-query-count={queryCount}
      data-target-table={targetTable}
    >
      <AlertTriangle
        className="w-5 h-5 text-error mt-0.5 shrink-0"
        data-label="alert-icon"
      />

      <div className="flex flex-col gap-2 w-full min-w-0">
        <h3
          className="font-body-md text-sm font-bold text-on-error-container"
          data-label="alert-title"
        >
          {title}
        </h3>

        <p
          className="font-code-sm text-xs text-on-surface-variant bg-surface-dim p-2.5 rounded border border-outline-variant overflow-x-auto"
          data-label="alert-description"
        >
          Loop in{" "}
          <span
            className="text-primary font-semibold"
            data-label="loop-location"
          >
            {loopLocation}
          </span>{" "}
          triggers {queryCount} redundant queries to{" "}
          <span
            className="text-tertiary font-semibold"
            data-label="target-table"
          >
            {targetTable}
          </span>{" "}
          table.
        </p>

        {traces.length > 0 && (
          <div
            className="mt-2 flex flex-col gap-1 border-l-2 border-outline-variant pl-3 overflow-x-auto"
            data-label="trace-container"
          >
            <div
              className="font-code-sm text-[10px] text-on-surface-variant uppercase tracking-wider"
              data-label="trace-label"
            >
              Trace:
            </div>
            {traces.map((trace, index) => (
              <div
                key={index}
                className={`font-code-sm text-xs text-on-surface whitespace-nowrap ${index === 0 ? "opacity-90" : "opacity-60"}`}
                data-label={`trace-item-${index}`}
              >
                {trace}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SummaryPanel({
  result,
  "data-label": testId = "summary-panel",
}) {
  if (!result) return null;

  // Step 1: Extract the analysis array containing all detected issues
  const analysis = result?.analysis || [];
  const nPlusOneDetected = analysis.length > 0;

  // Step 2: Handle the clean state (no issues found)
  if (!nPlusOneDetected) {
    return (
      <div
        className="p-4 md:p-md bg-surface-container border border-outline-variant rounded flex flex-col justify-center gap-2"
        data-label={`${testId}-clean`}
        data-n-plus-one={false}
      >
        <span
          className="font-label-caps text-xs text-on-surface-variant flex items-center gap-1.5 font-medium"
          data-label={`${testId}-status-label`}
        >
          <CheckCircle2 className="w-4 h-4 text-success" /> N+1 Status
        </span>
        <div
          className="font-headline-md text-headline-md text-[#a5d6a7] font-semibold"
          data-label={`${testId}-status-value`}
        >
          Clean
        </div>
        <div
          className="w-full bg-surface rounded-full h-1 mt-1"
          data-label={`${testId}-progress-bar`}
        >
          <div
            className="bg-success h-1 rounded-full w-full"
            data-label={`${testId}-progress-fill`}
          />
        </div>
        <p
          className="font-body-sm text-xs text-on-surface-variant mt-2"
          data-label={`${testId}-description`}
        >
          No N+1 issues detected. All query patterns look healthy for this
          endpoint.
        </p>
      </div>
    );
  }

  // Step 3: Handle the state where one OR multiple issues are found
  return (
    <div
      className="p-4 md:p-md bg-surface flex-1 flex flex-col gap-4 md:gap-md overflow-y-auto"
      data-label={testId}
      data-n-plus-one={true}
    >
      {/* Optional Step 4: Add a summary header indicating how many issues were found */}
      <div className="flex items-center gap-2 pb-2 border-b border-outline-variant">
        <AlertTriangle className="w-4 h-4 text-error" />
        <span className="text-sm font-semibold text-error">
          Found {analysis.length} N+1 Issue{analysis.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Step 5: Map through the entire analysis array to render a card for each issue */}
      {analysis.map((issue, index) => {
        // Step 6: Extract traces dynamically for the current issue in the loop
        const traces = issue?.src_loc
          ? [issue.src_loc, issue.sample_queries?.[0]].filter(Boolean)
          : [];

        // Step 7: Return the customized card component for the current issue
        return (
          <N1AlertCard
            key={index}
            title={`Redundant Query Loop Detected`}
            loopLocation={issue?.src_loc || "Unknown Location"}
            queryCount={issue?.count || 10}
            targetTable={issue?.table || "'unknown'"}
            traces={traces}
            data-label={`${testId}-n1-alert-${index}`}
          />
        );
      })}
    </div>
  );
}
