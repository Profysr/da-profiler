// App.jsx
import { useEffect } from 'react'
import { Layout } from './components/layout/Layout.jsx'
import { ProfilerPanel } from './components/profiler/ProfilerPanel.jsx'
import { useRoutes } from './hooks/useRoutes.js'
import { useProfile } from './hooks/useProfile.js'
import { useHealth } from './hooks/useHealth.js'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js'
import { useUIStore } from './store/uiStore.js'

/**
 * Main App component
 */
function App() {
  // Initialize hooks
  const routes = useRoutes()
  const profile = useProfile()
  // const health = useHealth()
  useKeyboardShortcuts()
  
  // Apply theme on mount
  useEffect(() => {
    const theme = useUIStore.getState().theme
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [])
  
  return (
    <Layout>
      <ProfilerPanel />
    </Layout>
  )
}

export default App