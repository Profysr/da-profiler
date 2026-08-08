// components/layout/Layout.jsx
import { cn } from '../../utils/classNames.js'
import { Header } from './Header.jsx'
import { Sidebar } from './Sidebar.jsx'
import { useUIStore } from '../../store/uiStore.js'

/**
 * Main layout component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export function Layout({ children }) {
  const { sidebarCollapsed } = useUIStore()
  
  return (
    <div className="min-h-screen bg-bg-primary">
      <Header 
        onToggleSidebar={() => useUIStore.getState().toggleSidebar()}
        sidebarCollapsed={sidebarCollapsed}
      />
      
      <div className="pt-14 min-h-[calc(100vh-3.5rem)]">
        <Sidebar />
        
        <main 
          className={cn(
            'transition-all duration-normal min-h-[calc(100vh-3.5rem)]',
            sidebarCollapsed ? 'ml-16' : 'ml-[320px]'
          )}
          style={{ marginLeft: sidebarCollapsed ? '64px' : '320px' }}
        >
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}