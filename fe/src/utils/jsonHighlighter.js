// utils/jsonHighlighter.js

const TOKEN_TYPES = {
  KEY: 'key',
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  NULL: 'null',
  PUNCTUATION: 'punctuation',
  WHITESPACE: 'whitespace',
}

export function tokenizeJSON(json) {
  if (!json) return []
  
  const tokens = []
  let i = 0
  const len = json.length
  let inString = false
  let stringChar = ''
  let escaped = false
  let tokenStart = 0
  
  while (i < len) {
    const char = json[i]
    
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === stringChar) {
        inString = false
      }
      i++
      continue
    }
    
    // String start
    if (char === '"' || char === "'") {
      if (i > tokenStart) {
        const value = json.slice(tokenStart, i)
        tokens.push(...classifyToken(value))
      }
      inString = true
      stringChar = char
      tokenStart = i
      i++
      continue
    }
    
    // Whitespace
    if (/\s/.test(char)) {
      if (i > tokenStart) {
        const value = json.slice(tokenStart, i)
        tokens.push(...classifyToken(value))
      }
      let j = i
      while (j < len && /\s/.test(json[j])) j++
      tokens.push({ type: TOKEN_TYPES.WHITESPACE, value: json.slice(i, j) })
      i = j
      tokenStart = i
      continue
    }
    
    // Punctuation
    if (/[{}[\]:,]/.test(char)) {
      if (i > tokenStart) {
        const value = json.slice(tokenStart, i)
        tokens.push(...classifyToken(value))
      }
      tokens.push({ type: TOKEN_TYPES.PUNCTUATION, value: char })
      i++
      tokenStart = i
      continue
    }
    
    i++
  }
  
  // Remaining token
  if (tokenStart < len) {
    const value = json.slice(tokenStart)
    tokens.push(...classifyToken(value))
  }
  
  return tokens
}

function classifyToken(value) {
  const trimmed = value.trim()
  if (!trimmed) return [{ type: TOKEN_TYPES.WHITESPACE, value }]
  
  // Numbers
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
    return [{ type: TOKEN_TYPES.NUMBER, value }]
  }
  
  // Booleans
  if (trimmed === 'true' || trimmed === 'false') {
    return [{ type: TOKEN_TYPES.BOOLEAN, value }]
  }
  
  // Null
  if (trimmed === 'null') {
    return [{ type: TOKEN_TYPES.NULL, value }]
  }
  
  // String (quoted)
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return [{ type: TOKEN_TYPES.STRING, value }]
  }
  
  // Default to key/identifier
  return [{ type: TOKEN_TYPES.KEY, value }]
}

export function getJSONTokenClass(type) {
  const classes = {
    [TOKEN_TYPES.KEY]: 'text-accent-blue',
    [TOKEN_TYPES.STRING]: 'text-accent-green',
    [TOKEN_TYPES.NUMBER]: 'text-accent-orange',
    [TOKEN_TYPES.BOOLEAN]: 'text-accent-red',
    [TOKEN_TYPES.NULL]: 'text-text-secondary italic',
    [TOKEN_TYPES.PUNCTUATION]: 'text-text-secondary',
    [TOKEN_TYPES.WHITESPACE]: '',
  }
  return classes[type] || ''
}

export function highlightJSON(json) {
  const tokens = tokenizeJSON(json)
  return tokens.map((token, index) => ({
    key: index,
    className: getJSONTokenClass(token.type),
    children: token.value,
  }))
}

export function formatJSON(obj, indent = 2) {
  try {
    return JSON.stringify(obj, null, indent)
  } catch {
    return String(obj)
  }
}

export function parseAndFormatJSON(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr)
    return formatJSON(parsed)
  } catch {
    return jsonStr
  }
}