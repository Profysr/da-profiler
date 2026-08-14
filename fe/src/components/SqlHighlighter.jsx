import { useEffect, useRef } from 'react'
import hljs from 'highlight.js/lib/core'
import sqlLang from 'highlight.js/lib/languages/sql'
import pgsql from 'highlight.js/lib/languages/pgsql'

hljs.registerLanguage('sql', sqlLang)
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

/**
 * Formats dense single-line SQL queries into clean multi-line code blocks
 */
export function formatSql(sqlInput) {
  if (!sqlInput || typeof sqlInput !== 'string') return ''
  const trimmed = sqlInput.trim()
  
  // If query is already formatted on multiple lines, keep it as is
  if (trimmed.includes('\n')) return trimmed

  // Core SQL keywords to split onto separate lines for code block readability
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET',
    'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'CROSS JOIN', 'JOIN',
    'UNION ALL', 'UNION', 'VALUES', 'SET', 'UPDATE', 'INSERT INTO', 'DELETE FROM',
    'AND', 'OR'
  ]

  let formatted = trimmed
  keywords.forEach((kw) => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'gi')
    formatted = formatted.replace(regex, '\n$1')
  })

  return formatted.trim()
}

export function SqlHighlighter({ 
  sql, 
  className = '', 
  maxHeight = '300px', 
  dialect = 'sql'
}) {
  const codeRef = useRef(null)
  const language = getLanguage(dialect)
  const formattedSql = formatSql(sql)

  useEffect(() => {
    if (codeRef.current) {
      // Re-run syntax highlighting whenever sql or language changes
      codeRef.current.removeAttribute('data-highlighted')
      hljs.highlightElement(codeRef.current)
    }
  }, [formattedSql, language])

  if (!sql) return null

  return (
    <div className={className} style={{ maxHeight, overflow: 'auto' }}>
      <pre className="m-0 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
        <code 
          ref={codeRef} 
          className={`hljs language-${language}`}
          data-language={language}
        >
          {formattedSql}
        </code>
      </pre>
    </div>
  )
}

export function InlineSql({ sql, className = '', dialect = 'sql' }) {
  const codeRef = useRef(null)
  const language = getLanguage(dialect)

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.removeAttribute('data-highlighted')
      hljs.highlightElement(codeRef.current)
    }
  }, [sql, language])

  if (!sql) return null

  return (
    <code 
      ref={codeRef} 
      className={`hljs language-${language} font-mono text-xs ${className}`}
      data-language={language}
    >
      {sql.trim()}
    </code>
  )
}