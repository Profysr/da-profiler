import { useEffect, useRef } from 'react'
import hljs from 'highlight.js/lib/core'
import sql from 'highlight.js/lib/languages/sql'
import pgsql from 'highlight.js/lib/languages/pgsql'
import 'highlight.js/styles/atom-one-dark.css'
import 'highlight.js/styles/atom-one-light.css'

hljs.registerLanguage('sql', sql)
hljs.registerLanguage('pgsql', pgsql)

const DIALECT_MAP = {
  postgres: 'pgsql',
  postgresql: 'pgsql',
  mysql: 'sql',
  sqlite: 'sql',
  sqlite3: 'sql',
}

function getLanguage(dialect = 'sql') {
  return DIALECT_MAP[dialect.toLowerCase()] || 'sql'
}

export function SqlHighlighter({ 
  sql, 
  className = '', 
  maxHeight = '300px', 
  theme = 'dark',
  dialect = 'sql'
}) {
  const preRef = useRef(null)
  const language = getLanguage(dialect)

  useEffect(() => {
    if (preRef.current) {
      hljs.highlightElement(preRef.current)
    }
  }, [sql, language])

  if (!sql) return null

  const themeClass = theme === 'dark' ? 'hljs atom-one-dark' : 'hljs atom-one-light'

  return (
    <div className={className} style={{ maxHeight, overflow: 'auto' }}>
      <pre style={{ margin: 0, padding: '1rem', fontSize: '0.875rem', lineHeight: '1.5' }}>
        <code 
          ref={preRef} 
          className={`${themeClass} language-${language}`}
          data-language={language}
        >
          {sql.trim()}
        </code>
      </pre>
    </div>
  )
}

export function InlineSql({ sql, className = '', theme = 'dark', dialect = 'sql' }) {
  const preRef = useRef(null)
  const language = getLanguage(dialect)

  useEffect(() => {
    if (preRef.current) {
      hljs.highlightElement(preRef.current)
    }
  }, [sql, language])

  if (!sql) return null

  const themeClass = theme === 'dark' ? 'hljs atom-one-dark' : 'hljs atom-one-light'

  return (
    <code 
      ref={preRef} 
      className={`${themeClass} language-${language} font-mono text-sm ${className}`}
      style={{ 
        padding: '0.25rem 0.5rem', 
        borderRadius: '0.25rem', 
        backgroundColor: theme === 'dark' ? '#282c34' : '#fafafa' 
      }}
      data-language={language}
    >
      {sql.trim()}
    </code>
  )
}