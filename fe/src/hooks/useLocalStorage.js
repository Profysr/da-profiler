// hooks/useLocalStorage.js
import { useState, useEffect, useCallback } from 'react'

/**
 * Hook for syncing state with localStorage
 * @param {string} key - localStorage key
 * @param {any} initialValue - Initial value
 * @returns {[any, Function]} State and setter
 */
export function useLocalStorage(key, initialValue) {
  // Get value from localStorage or use initial
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })
  
  // Update localStorage when state changes
  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error saving to localStorage key "${key}":`, error)
    }
  }, [key, storedValue])
  
  return [storedValue, setValue]
}

/**
 * Hook for persisting a Zustand store slice to localStorage
 * @param {string} key - localStorage key
 * @param {Function} selector - Zustand selector
 * @returns {any} Selected state
 */
export function usePersistedStore(key, selector) {
  const [storedValue, setStoredValue] = useLocalStorage(key, null)
  
  return storedValue
}