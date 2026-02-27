import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg)' }}>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity"
          onClick={closeMobileMenu}
        />
      )}

      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        closeMobileMenu={closeMobileMenu}
      />
      <main
        className="min-h-screen transition-all duration-300 md:ml-[var(--sidebar-w)]"
      >
        <div className="p-4 md:p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
