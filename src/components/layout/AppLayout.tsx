import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useModalContext } from '@/context/ModalContext'
import Sidebar from './Sidebar'
import styles from './AppLayout.module.css'

export default function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const { isModalOpen } = useModalContext()

  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved !== null) {
      setIsSidebarCollapsed(JSON.parse(saved))
    }
  }, [])

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed
    setIsSidebarCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState))
  }

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg)' }}>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity"
          onClick={closeMobileMenu}
        />
      )}

      <div
        className={`transition-all duration-300 ${isModalOpen ? styles.blurred : ''}`}
        style={{ display: 'flex' }}
      >
        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          closeMobileMenu={closeMobileMenu}
          isCollapsed={isSidebarCollapsed}
          toggleCollapse={toggleSidebar}
        />
        <main
          className={`min-h-screen flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-[80px]' : 'md:ml-[var(--sidebar-w)]'}`}
          style={{ background: 'var(--bg-page)' }}
        >
          <div className="p-4 md:p-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
