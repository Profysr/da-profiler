import { JsonViewer } from '../../ui/JsonViewer.jsx';
import { EmptyState } from '../../dashboard/EmptyState.jsx';

export function ResponseTab({ result, "data-label": testId = "response-tab" }) {
  const responseBody = result?.response_body;

  if (!result || responseBody === null || responseBody === undefined) {
    return (
      <EmptyState
        title="No Response Body"
        description="The endpoint returned no parseable response body."
        icon={
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
        }
        data-label={`${testId}-empty-state`}
      />
    );
  }

  return (
    <div className="p-4 md:p-md bg-surface flex-1 flex flex-col gap-4 overflow-y-auto" data-label={testId} data-has-response={!!responseBody}>
      <div className="flex items-center justify-between" data-label={`${testId}-header`}>
        <span className="font-label-caps text-label-caps text-on-surface-variant" data-label={`${testId}-title`}>
          Response Payload (JSON)
        </span>
      </div>
      <JsonViewer data={responseBody} maxHeight="500px" copyable={true} data-label={`${testId}-json-viewer`} />
    </div>
  );
}