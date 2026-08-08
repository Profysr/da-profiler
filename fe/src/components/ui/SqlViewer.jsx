// components/ui/SqlViewer.jsx
import { cn } from '../../utils/classNames.js'
import { SqlHighlighter, InlineSql } from './SqlHighlighter.jsx'
import { CopyButton } from './CopyButton.jsx'

export function SqlViewer({ sql, className = '', maxHeight = '300px', showLineNumbers = true, copyable = true }) {
  return (
    <div className={cn('relative', className)}>
      {copyable && sql && (
        <div className="absolute top-2 right-2 z-10">
          <CopyButton text={sql} />
        </div>
      )}
      <div className="bg-bg-secondary border border-border rounded-lg overflow-auto" style={{ maxHeight }}>
        <SqlHighlighter 
          sql={sql} 
          showLineNumbers={showLineNumbers} 
          maxHeight={maxHeight}
          className="font-mono text-sm"
        />
      </div>
    </div>
  )
}

export { InlineSql }