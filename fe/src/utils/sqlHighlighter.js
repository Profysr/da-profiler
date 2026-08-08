// utils/sqlHighlighter.js

/**
 * SQL Token types
 */
const TOKEN_TYPES = {
  KEYWORD: 'keyword',
  FUNCTION: 'function',
  STRING: 'string',
  NUMBER: 'number',
  OPERATOR: 'operator',
  IDENTIFIER: 'identifier',
  COMMENT: 'comment',
  PUNCTUATION: 'punctuation',
  VARIABLE: 'variable',
}

/**
 * SQL Keywords for highlighting
 */
const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'FULL', 'CROSS',
  'ON', 'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'BETWEEN', 'LIKE', 'ILIKE', 'IS', 'NULL',
  'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'DISTINCT', 'AS', 'ASC', 'DESC',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'INDEX',
  'ALTER', 'DROP', 'TRUNCATE', 'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION',
  'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'CHECK', 'DEFAULT', 'NOT NULL',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'CAST', 'COALESCE', 'NULLIF',
  'UNION', 'INTERSECT', 'EXCEPT', 'WITH', 'RECURSIVE',
])

/**
 * SQL Functions for highlighting
 */
const SQL_FUNCTIONS = new Set([
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'NOW', 'CURRENT_TIMESTAMP', 'CURRENT_DATE',
  'EXTRACT', 'DATE_TRUNC', 'TO_CHAR', 'TO_DATE', 'CONCAT', 'SUBSTRING', 'LENGTH',
  'UPPER', 'LOWER', 'TRIM', 'COALESCE', 'NULLIF', 'GREATEST', 'LEAST',
])

/**
 * Tokenize SQL string
 * @param {string} sql - SQL query string
 * @returns {Array} Array of tokens with type and value
 */
export function tokenizeSQL(sql) {
  if (!sql) return []
  
  const tokens = []
  let i = 0
  const len = sql.length
  
  while (i < len) {
    const char = sql[i]
    
    // Whitespace
    if (/\s/.test(char)) {
      let j = i
      while (j < len && /\s/.test(sql[j])) j++
      tokens.push({ type: 'whitespace', value: sql.slice(i, j) })
      i = j
      continue
    }
    
    // Single line comment
    if (char === '-' && sql[i + 1] === '-') {
      let j = i + 2
      while (j < len && sql[j] !== '\n') j++
      tokens.push({ type: TOKEN_TYPES.COMMENT, value: sql.slice(i, j) })
      i = j
      continue
    }
    
    // Multi-line comment
    if (char === '/' && sql[i + 1] === '*') {
      let j = i + 2
      while (j < len - 1 && !(sql[j] === '*' && sql[j + 1] === '/')) j++
      j += 2
      tokens.push({ type: TOKEN_TYPES.COMMENT, value: sql.slice(i, j) })
      i = j
      continue
    }
    
    // String literals
    if (char === "'" || char === '"') {
      const quote = char
      let j = i + 1
      let escaped = false
      while (j < len) {
        if (escaped) {
          escaped = false
        } else if (sql[j] === '\\') {
          escaped = true
        } else if (sql[j] === quote) {
          j++
          break
        }
        j++
      }
      tokens.push({ type: TOKEN_TYPES.STRING, value: sql.slice(i, j) })
      i = j
      continue
    }
    
    // Numbers
    if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(sql[i + 1]))) {
      let j = i
      let hasDot = false
      while (j < len) {
        const c = sql[j]
        if (/[0-9]/.test(c)) {
          j++
        } else if (c === '.' && !hasDot) {
          hasDot = true
          j++
        } else {
          break
        }
      }
      tokens.push({ type: TOKEN_TYPES.NUMBER, value: sql.slice(i, j) })
      i = j
      continue
    }
    
    // Variables (?, $1, :name, @name)
    if (char === '?' || char === '$' || char === ':' || char === '@') {
      let j = i + 1
      if (char === '?' || char === '$') {
        while (j < len && /[0-9]/.test(sql[j])) j++
      } else {
        while (j < len && /[a-zA-Z0-9_$]/.test(sql[j])) j++
      }
      tokens.push({ type: TOKEN_TYPES.VARIABLE, value: sql.slice(i, j) })
      i = j
      continue
    }
    
    // Operators and punctuation
    if (/[=<>!+\-*/%,;().]/.test(char)) {
      // Check for multi-char operators
      const twoChar = sql.slice(i, i + 2)
      if (['<=', '>=', '<>', '!=', '||', '->', '=>'].includes(twoChar)) {
        tokens.push({ type: TOKEN_TYPES.OPERATOR, value: twoChar })
        i += 2
      } else {
        tokens.push({ type: char === '.' || char === ',' || char === ';' || char === '(' || char === ')' ? TOKEN_TYPES.PUNCTUATION : TOKEN_TYPES.OPERATOR, value: char })
        i++
      }
      continue
    }
    
    // Identifiers and keywords
    if (/[a-zA-Z_$]/.test(char)) {
      let j = i
      while (j < len && /[a-zA-Z0-9_$]/.test(sql[j])) j++
      const word = sql.slice(i, j)
      const upperWord = word.toUpperCase()
      
      if (SQL_KEYWORDS.has(upperWord)) {
        tokens.push({ type: TOKEN_TYPES.KEYWORD, value: word })
      } else if (SQL_FUNCTIONS.has(upperWord) && j < len && sql[j] === '(') {
        tokens.push({ type: TOKEN_TYPES.FUNCTION, value: word })
      } else {
        tokens.push({ type: TOKEN_TYPES.IDENTIFIER, value: word })
      }
      i = j
      continue
    }
    
    // Unknown character
    tokens.push({ type: 'unknown', value: char })
    i++
  }
  
  return tokens
}

/**
 * Get CSS class for token type
 * @param {string} type - Token type
 * @returns {string} CSS class
 */
export function getTokenClass(type) {
  const classes = {
    [TOKEN_TYPES.KEYWORD]: 'text-accent-blue font-medium',
    [TOKEN_TYPES.FUNCTION]: 'text-accent-orange font-medium',
    [TOKEN_TYPES.STRING]: 'text-accent-green',
    [TOKEN_TYPES.NUMBER]: 'text-accent-orange',
    [TOKEN_TYPES.OPERATOR]: 'text-text-secondary',
    [TOKEN_TYPES.IDENTIFIER]: 'text-text-primary',
    [TOKEN_TYPES.COMMENT]: 'text-text-secondary italic',
    [TOKEN_TYPES.PUNCTUATION]: 'text-text-secondary',
    [TOKEN_TYPES.VARIABLE]: 'text-accent-red font-mono',
    whitespace: '',
    unknown: '',
  }
  return classes[type] || ''
}

/**
 * Highlight SQL and return array of token spans
 * @param {string} sql - SQL query string
 * @returns {Array} Array of {className, children} for rendering
 */
export function highlightSQL(sql) {
  const tokens = tokenizeSQL(sql)
  return tokens.map((token, index) => ({
    key: index,
    className: getTokenClass(token.type),
    children: token.value,
  }))
}

/**
 * Format SQL with line numbers
 * @param {string} sql - SQL query string
 * @returns {Array} Array of line objects with number and highlighted tokens
 */
export function formatSQLWithLineNumbers(sql) {
  if (!sql) return []
  
  const lines = sql.split('\n')
  return lines.map((line, lineIndex) => ({
    lineNumber: lineIndex + 1,
    tokens: highlightSQL(line),
  }))
}