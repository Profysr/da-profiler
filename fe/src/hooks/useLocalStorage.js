// hooks/useLocalStorage.js
import { useState, useCallback } from 'react'

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

export function usePersistedStore(key, selector) {
  const [storedValue, setStoredValue] = useLocalStorage(key, null)
  return storedValue
}