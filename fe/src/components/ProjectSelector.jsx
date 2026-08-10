// components/ProjectSelector.jsx
import { useConnectionsStore } from '../store/connectionsStore.js'
import { ChevronDown, Wifi, WifiOff, Plus, Settings } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Button } from './ui/Button.jsx'

export function ProjectSelector() {
  const { connections, activeConnectionId, setActiveConnection, getActiveConnection } = useConnectionsStore()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const activeConnection = getActiveConnection()

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (id) => {
    setActiveConnection(id)
    setIsOpen(false)
  }

  if (connections.length === 0) {
    return (
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.dispatchEvent(new CustomEvent('dqs:open-connections'))}>
        <Plus className="w-4 h-4" />
        <span>Add Project</span>
      </Button>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 justify-between w-48 sm:w-56"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 flex-1 text-left">
          <div className={`w-2 h-2 rounded-full ${activeConnection?.connected ? 'bg-green-400' : 'bg-gray-500'}`} />
          <span className="truncate font-medium text-sm">{activeConnection?.name || 'Select Project'}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-surface-container border border-outline-variant rounded-lg shadow-lg py-1 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
          {connections.map((conn) => (
            <button
              key={conn.id}
              onClick={() => handleSelect(conn.id)}
              className={`w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-surface transition-colors ${conn.id === activeConnectionId ? 'bg-primary/10' : ''}`}
            >
              <div className={`w-2 h-2 rounded-full ${conn.connected ? 'bg-green-400' : 'bg-gray-500'}`} />
              <span className="flex-1 truncate text-sm font-medium">{conn.name}</span>
              {conn.id === activeConnectionId && <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">Active</span>}
            </button>
          ))}
          <hr className="my-1 border-outline-variant" />
          <button
            onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('dqs:open-connections')) }}
            className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 text-sm text-primary hover:bg-primary/10 rounded-lg mx-1"
          >
            <Plus className="w-4 h-4" />
            <span>Manage Connections</span>
          </button>
        </div>
      )}
    </div>
  )
}