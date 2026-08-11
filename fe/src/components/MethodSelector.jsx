// src/components/MethodSelector.jsx
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { HTTP_METHODS } from '../utils/constants.js'

function getMethodBadgeClass(method) {
  switch (method) {
    case 'GET':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    case 'POST':
      return 'bg-orange-500/15 text-orange-400 border-orange-500/30'
    case 'PUT':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    case 'PATCH':
      return 'bg-teal-500/15 text-teal-400 border-teal-500/30'
    case 'DELETE':
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
    default:
      return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
  }
}

export function MethodSelector({
  value = 'GET',
  onChange,
  methods = HTTP_METHODS,
  'data-label': testId = 'method-selector',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  const currentBadgeClass = getMethodBadgeClass(value)

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setIsOpen(false)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsOpen((prev) => !prev)
    }
  }

  function handleSelect(methodId) {
    onChange?.(methodId)
    setIsOpen(false)
  }

  return (
    <div
      ref={containerRef}
      className="relative w-32 shrink-0 select-none"
      data-label={testId}
    >
      {/* Postman-styled Complete Selector Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="HTTP method"
        data-label={`${testId}-trigger`}
        className={`flex items-center justify-between w-full h-10 px-3 border rounded transition-all cursor-pointer font-mono text-xs font-bold focus:outline-none focus:border-primary active:scale-[0.99] ${currentBadgeClass}`}
      >
        <span>{value}</span>
        <ChevronDown
          size={16}
          className={`opacity-70 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Postman-styled Floating Menu Dropdown */}
      {isOpen && (
        <ul
          role="listbox"
          aria-label="HTTP method options"
          data-label={`${testId}-options`}
          className="absolute left-0 top-full mt-1.5 w-36 bg-[#1e1e1e] border border-zinc-700/60 rounded-md shadow-xl z-50 overflow-hidden py-1 backdrop-blur-md"
        >
          {methods.map((m) => {
            const methodId = typeof m === 'string' ? m : m.id
            const itemBadgeClass = getMethodBadgeClass(methodId)
            const isSelected = methodId === value

            return (
              <li
                key={methodId}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(methodId)}
                className={`flex items-center justify-between px-3 py-1.5 text-xs font-mono font-bold cursor-pointer transition-colors hover:bg-zinc-800/80 ${
                  isSelected ? 'bg-zinc-800' : ''
                }`}
              >
                <span className={`px-1.5 py-0.5 border rounded text-[11px] ${itemBadgeClass}`}>
                  {methodId}
                </span>
                {isSelected && (
                  <Check size={14} className="text-primary ml-2" />
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
