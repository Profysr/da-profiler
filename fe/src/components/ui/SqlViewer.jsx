// components/ui/SqlViewer.jsx
import { cn } from '../../utils/classNames.js'
import { highlightSQL, formatSQLWithLineNumbers } from '../../utils/sqlHighlighter.js'
import { CopyButton } from './CopyButton.jsx'

/**
 * SQL Viewer component with syntax highlighting and line numbers
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function SqlViewer({ sql, className = '', maxHeight = '300px', showLineNumbers = true, copyable = true }) {
  const lines = formatSQLWithLineNumbers(sql)
  
  return (
    <div className={cn('relative font-mono text-sm', className)}>
      {copyable && (
        <div className="absolute top-2 right-2 z-10">
          <CopyButton text={sql} />
        </div>
      )}
      <pre className={cn('p-4 bg-bg-secondary border border-border rounded-lg overflow-auto', 'max-h-[${maxHeight}]')} style={{ maxHeight }}>
        <code className="whitespace-pre-wrap break-all">
          {showLineNumbers ? (
            <table className="w-full border-collapse">
              <tbody>
                {lines.map((line, index) => (
                  <tr key={index}>
                    <td className="text-text-secondary pr-4 text-right select-none w-12">
                      {line.lineNumber}
                    </td>
                    <td className="text-left">
                      {line.tokens.map((token) => (
                        <span key={token.key} className={token.className}>
                          {token.children}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            lines.map((line, index) => (
              <div key={index}>
                {line.tokens.map((token) => (
                  <span key={token.key} className={token.className}>
                    {token.children}
                  </span>
                ))}
              </div>
            ))
          )}
        </code>
      </pre>
    </div>
  )
}

/**
 * Inline SQL component for single-line display
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function InlineSql({ sql, className = '' }) {
  const tokens = highlightSQL(sql)
  
  return (
    <code className={cn('font-mono text-sm', className)}>
      {tokens.map((token) => (
        <span key={token.key} className={token.className}>
          {token.children}
        </span>
      ))}
    </code>
  )
}