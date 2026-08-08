// components/ui/SqlHighlighter.jsx
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql'
import { dracula, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import vsDark from 'react-syntax-highlighter/dist/esm/styles/prism/vs-dark.js'

SyntaxHighlighter.registerLanguage('sql', sql)

const THEMES = {
  dark: dracula,
  light: vsDark,
}

function getHighlighterTheme(theme = 'dark') {
  return THEMES[theme] || THEMES.dark
}

export function SqlHighlighter({ sql, className = '', maxHeight = '300px', showLineNumbers = true, theme = 'dark', copyable = true }) {
  if (!sql) return null
  
  const highlighterTheme = getHighlighterTheme(theme)
  
  return (
    <SyntaxHighlighter
      language="sql"
      style={highlighterTheme}
      showLineNumbers={showLineNumbers}
      wrapLines={true}
      className={className}
      customStyle={{
        maxHeight,
        overflow: 'auto',
        fontSize: '0.875rem',
        lineHeight: '1.5',
      }}
    >
      {sql.trim()}
    </SyntaxHighlighter>
  )
}

export function InlineSql({ sql, className = '', theme = 'dark' }) {
  if (!sql) return null
  
  const highlighterTheme = getHighlighterTheme(theme)
  
  return (
    <SyntaxHighlighter
      language="sql"
      style={highlighterTheme}
      className={`font-mono text-sm ${className}`}
      customStyle={{
        padding: '0.25rem 0.5rem',
        borderRadius: '0.25rem',
        backgroundColor: 'transparent',
      }}
    >
      {sql.trim()}
    </SyntaxHighlighter>
  )
}