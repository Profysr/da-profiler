// components/animations/SlideIn.jsx
import { motion } from 'framer-motion'

/**
 * Slide in animation component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function SlideIn({
  children,
  direction = 'right',
  delay = 0,
  duration = 0.25,
  className = '',
  ...props
}) {
  const variants = {
    right: { x: 20, opacity: 0 },
    left: { x: -20, opacity: 0 },
    up: { y: 20, opacity: 0 },
    down: { y: -20, opacity: 0 },
  }
  
  return (
    <motion.div
      initial={variants[direction]}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * Slide in/out with AnimatePresence
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function SlideInOut({
  show,
  children,
  direction = 'right',
  delay = 0,
  duration = 0.2,
  className = '',
}) {
  const variants = {
    right: { x: 20, opacity: 0 },
    left: { x: -20, opacity: 0 },
    up: { y: 20, opacity: 0 },
    down: { y: -20, opacity: 0 },
  }
  
  return (
    <motion.div
      initial={false}
      animate={show ? { x: 0, y: 0, opacity: 1 } : variants[direction]}
      exit={variants[direction]}
      transition={{ duration, delay, ease: 'easeInOut' }}
      className={className}
    >
      {show && children}
    </motion.div>
  )
}