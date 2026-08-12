import { Workbench } from './components/Workbench.jsx'
import { ToastProvider } from './components/ui/toast.jsx'

export default function App() {
  return (
    <ToastProvider>
      <Workbench />
    </ToastProvider>
  )
}

