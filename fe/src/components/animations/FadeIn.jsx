// components/animations/FadeIn.jsx
import { motion } from 'framer-motion'

/**
 * Fade in animation component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function FadeIn({ children, delay = 0, duration = 0.2, className = '', ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * Fade in/out with AnimatePresence
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function FadeInOut({ show, children, delay = 0, duration = 0.2, className = '' }) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: show ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {show && children}
    </motion.div>
  )
}