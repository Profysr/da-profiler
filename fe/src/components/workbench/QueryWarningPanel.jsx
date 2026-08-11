// components/workbench/QueryWarningPanel.jsx
import { N1_WARNING_PANEL } from './data.js'

const TOKEN_CLASS = {
  plain: '',
  kw: 'text-tertiary',
  num: 'text-primary-container',
  cls: 'text-secondary-container',
  cmt: 'text-outline-variant',
  del: 'text-error line-through',
  fix: 'text-tertiary-fixed-dim',
}

function SqlLine({ line }) {
  return (
    <code className="text-secondary">
      {line.map((tok, i) => (
        <span key={i} className={TOKEN_CLASS[tok.t] || ''}>
          {tok.v}
        </span>
      ))}
    </code>
  )
}

function WarningBanner({ title, body }) {
  return (
    <div
      className="bg-surface-variant border border-error rounded-md p-4 flex gap-3 items-start relative overflow-hidden"
      data-label="query-warning-banner"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-error" aria-hidden="true" />
      <span className="material-symbols-outlined text-error mt-0.5" aria-hidden="true">
        error
      </span>
      <div className="flex flex-col">
        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">{title}</h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{body}</p>
      </div>
    </div>
  )
}

function SqlSnippet({ query }) {
  return (
    <div
      className="border border-outline-variant rounded-md overflow-hidden flex flex-col"
      data-label="query-warning-snippet"
    >
      <div
        className="bg-surface border-b border-outline-variant p-2 flex items-center justify-between"
        data-label="query-warning-snippet-header"
      >
        <span className="font-label-caps text-label-caps text-on-surface-variant">{query.label}</span>
        <span className="font-code-sm text-code-sm text-on-surface-variant">{query.metric}</span>
      </div>

      <div className="p-4 bg-[#1e1e1e] overflow-x-auto" data-label="query-warning-snippet-body">
        <pre className="font-code-md text-code-md">
          {query.lines.map((line, i) => (
            <SqlLine key={i} line={line.tokens} />
          ))}
        </pre>
      </div>

      <div
        className="bg-surface-container p-2 border-t border-outline-variant border-dashed"
        data-label="query-warning-snippet-called-from"
      >
        <div className="font-code-sm text-code-sm text-on-surface-variant flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
            call_split
          </span>
          <span>
            Called from:{' '}
            <span className="text-secondary">{query.calledFrom}</span> in{' '}
            <span className="text-primary">{query.calledFromSymbol}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

function FixSuggestion({ fix }) {
  return (
    <div
      className="bg-tertiary-container/10 border border-tertiary/30 rounded-md p-4 flex flex-col gap-2"
      data-label="query-warning-fix"
    >
      <div className="flex items-center gap-2 text-tertiary">
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
          build
        </span>
        <span className="font-headline-sm text-headline-sm font-bold">{fix.title}</span>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface mb-2">{fix.body}</p>
      <div
        className="bg-[#1e1e1e] p-3 rounded border border-outline-variant overflow-x-auto"
        data-label="query-warning-fix-code"
      >
        <pre className="font-code-sm text-code-sm">
          {fix.lines.map((line, i) => (
            <code key={i} className="text-on-surface block">
              {line.length === 0 ? (
                <span>{' '}</span>
              ) : (
                line.map((tok, j) => (
                  <span key={j} className={TOKEN_CLASS[tok.t] || ''}>
                    {tok.v}
                  </span>
                ))
              )}
            </code>
          ))}
        </pre>
      </div>
    </div>
  )
}

export function QueryWarningPanel({
  data = N1_WARNING_PANEL,
  "data-label": testId = 'query-warning-panel',
}) {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4" data-label={testId}>
      <WarningBanner title={data.warning.title} body={data.warning.body} />
      <SqlSnippet query={data.query} />
      <FixSuggestion fix={data.fix} />
    </div>
  )
}
