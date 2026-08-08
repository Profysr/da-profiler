// components/animations/AnimatePresence.jsx
import { AnimatePresence as FramerAnimatePresence } from 'framer-motion'

/**
 * Wrapper for Framer Motion AnimatePresence with sensible defaults
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function AnimatePresence({ children, mode = 'wait', initial = false, ...props }) {
  return (
    <FramerAnimatePresence mode={mode} initial={initial} {...props}>
      {children}
    </FramerAnimatePresence>
  )
}

/**
 * Presence component for conditional rendering with animation
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function Presence({ show, children, ...props }) {
  return (
    <AnimatePresence {...props}>
      {show && children}
    </AnimatePresence>
  )
}