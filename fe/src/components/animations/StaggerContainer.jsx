// components/animations/StaggerContainer.jsx
import { motion } from 'framer-motion'

/**
 * Stagger container for animating children with delay
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function StaggerContainer({
  children,
  staggerDelay = 0.05,
  delay = 0,
  duration = 0.2,
  direction = 'up',
  className = '',
  ...props
}) {
  const variants = {
    up: { y: 20, opacity: 0 },
    down: { y: -20, opacity: 0 },
    right: { x: 20, opacity: 0 },
    left: { x: -20, opacity: 0 },
    fade: { opacity: 0 },
  }
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delay,
          },
        },
      }}
      className={className}
      {...props}
    >
      {React.Children.map(children, (child, index) => 
        React.isValidElement(child) ? (
          React.cloneElement(child, {
            variants: {
              hidden: variants[direction] || variants.fade,
              visible: {
                opacity: 1,
                x: 0,
                y: 0,
                transition: { duration, ease: 'easeOut' },
              },
            },
          })
        ) : child
      )}
    </motion.div>
  )
}

/**
 * Stagger item component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function StaggerItem({ children, className = '', ...props }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}