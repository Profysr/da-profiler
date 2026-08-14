// components/SqlViewer.jsx
import { cn } from '../utils/classNames.js'
import { SqlHighlighter, InlineSql } from './SqlHighlighter.jsx'
import { CopyButton } from './ui/CopyButton.jsx'

export function SqlViewer({ sql, className = '', maxHeight = '300px', showLineNumbers = true, copyable = true }) {
  return (
    <div className={cn('relative group border border-outline-variant rounded-lg bg-surface-container-lowest overflow-hidden shadow-sm', className)}>
      {copyable && sql && (
        <div className="absolute top-2 right-2 z-10 opacity-80 hover:opacity-100 transition-opacity">
          <CopyButton text={sql} />
        </div>
      )}
      <div className="overflow-auto" style={{ maxHeight }}>
        <SqlHighlighter 
          sql={sql} 
          showLineNumbers={showLineNumbers} 
          maxHeight={maxHeight}
          className="font-mono text-xs"
        />
      </div>
    </div>
  )
}

export { InlineSql }