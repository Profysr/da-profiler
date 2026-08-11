// src/components/Icon.jsx
import React from 'react'

/**
 * Universal Icon Component
 * Renders Material Symbols icon with configurable size (defaults to 14px as per design spec)
 */
export function Icon({
  name,
  size = 14,
  className = '',
  spin = false,
  ...props
}) {
  if (!name) return null

  return (
    <span
      className={[
        'material-symbols-outlined shrink-0 select-none inline-flex items-center justify-center',
        spin ? 'animate-spin' : '',
        className,
      ].join(' ')}
      style={{ fontSize: `${size}px`, width: `${size}px`, height: `${size}px` }}
      {...props}
    >
      {name}
    </span>
  )
}
