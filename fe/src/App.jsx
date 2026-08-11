import { useEffect } from 'react'
import { Workbench } from './components/workbench'
import { useUIStore } from './store/uiStore.js'

function App() {
  const theme = useUIStore((state) => state.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return <Workbench />
}

export default App
