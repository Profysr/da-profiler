// components/SqlViewer.jsx
import { cn } from '../utils/classNames.js'
import { SqlHighlighter, InlineSql } from './SqlHighlighter.jsx'
import { CopyButton } from './ui/CopyButton.jsx'

export function SqlViewer({ sql, className = '', maxHeight = '300px', showLineNumbers = true, copyable = true }) {
  return (
    <div className={cn('relative group', className)}>
      {copyable && sql && (
        <div className="absolute top-2 right-2 z-10 opacity-80 hover:opacity-100 transition-opacity">
          <CopyButton text={sql} />
        </div>
      )}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-auto" style={{ maxHeight }}>
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