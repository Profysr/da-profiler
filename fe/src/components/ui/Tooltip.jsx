// components/ui/Tooltip.jsx
import React, { useState, useRef, useEffect } from 'react'
import { cn } from '../../utils/classNames.js'

/**
 * Tooltip component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function Tooltip({ children, content, position = 'top', delay = 200, className = '' }) {
  const [visible, setVisible] = useState(false)
  const [tooltipRef, setTooltipRef] = useState(null)
  const triggerRef = useRef(null)
  const timeoutRef = useRef(null)
  
  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), delay)
  }
  
  const hide = () => {
    clearTimeout(timeoutRef.current)
    setVisible(false)
  }
  
  const handleMouseEnter = () => show()
  const handleMouseLeave = () => hide()
  const handleFocus = () => show()
  const handleBlur = () => hide()
  
  // Position tooltip
  useEffect(() => {
    if (!tooltipRef || !triggerRef.current) return
    
    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.getBoundingClientRect()
    const gap = 8
    
    let top, left
    
    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - gap
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
        break
      case 'bottom':
        top = triggerRect.bottom + gap
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
        break
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.left - tooltipRect.width - gap
        break
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.right + gap
        break
    }
    
    // Keep in viewport
    const viewportPadding = 8
    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - tooltipRect.width - viewportPadding))
    top = Math.max(viewportPadding, Math.min(top, window.innerHeight - tooltipRect.height - viewportPadding))
    
    tooltipRef.style.top = `${top}px`
    tooltipRef.style.left = `${left}px`
  }, [visible, position, tooltipRef])
  
  if (!visible || !content) return <>{children}</>
  
  return (
    <>
      {React.Children.map(children, (child) => 
        React.cloneElement(child, {
          ref: triggerRef,
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
          onFocus: handleFocus,
          onBlur: handleBlur,
        })
      )}
      <div
        ref={setTooltipRef}
        className={cn(
          'tooltip tooltip-show',
          'fixed z-50 px-2 py-1 text-xs text-text-primary bg-bg-tertiary border border-border rounded-md shadow-lg',
          className
        )}
        role="tooltip"
      >
        {content}
      </div>
    </>
  )
}