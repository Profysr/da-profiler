// utils/classNames.js
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines class names with tailwind-merge for conflict resolution
 * @param {...any} inputs - Class names to combine
 * @returns {string} Merged class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}