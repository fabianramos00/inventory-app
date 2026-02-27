import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Package,
  Truck,
  ShoppingCart,
  ClipboardList,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import styles from './Sidebar.module.css'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, code: 'DASH' },
  { to: '/inventory', label: 'Inventario', icon: Package, code: 'INV' },
  { to: '/providers', label: 'Proveedores', icon: Truck, code: 'PROV' },
  { to: '/sells', label: 'Ventas', icon: ShoppingCart, code: 'VNT' },
  { to: '/orders', label: 'Pedidos', icon: ClipboardList, code: 'PED' },
  { to: '/users', label: 'Usuarios', icon: Users, code: 'USR' },
]

interface SidebarProps {
  isMobileMenuOpen?: boolean;
  closeMobileMenu?: () => void;
}

export default function Sidebar({ isMobileMenuOpen, closeMobileMenu }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved))
    }
  }, [])

  // Save collapsed state to localStorage on change
  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState))
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-full flex flex-col z-30 transition-all duration-300 ease-in-out md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}
      style={{
        background: 'var(--surface)',
        borderRight: '1px solid var(--border-strong)',
        width: isCollapsed ? '80px' : 'var(--sidebar-w)',
      }}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center border-b transition-all duration-300",
          isCollapsed ? "px-2 py-6 flex-col gap-4" : "px-6 py-6 gap-3"
        )}
        style={{ borderColor: 'var(--border)' }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs"
          style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
        >
          J&S
        </div>
        {!isCollapsed && (
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: 'var(--ink-1)', letterSpacing: '-0.02em' }}>
              Ferretería
            </div>
            <div className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
              Inventario
            </div>
          </div>
        )}
        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-lg transition-colors duration-200 hover:bg-white/40 flex-shrink-0"
          style={{ color: 'var(--ink-2)' }}
          title={isCollapsed ? 'Expandir' : 'Contraer'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 overflow-y-auto transition-all duration-300", isCollapsed ? "py-3 px-1" : "py-5 px-3")}>
        <div className="space-y-6">
          {/* Section header */}
          <div>
            {!isCollapsed && (
              <div className="text-xs font-semibold uppercase tracking-wider px-4 mb-3" style={{ color: 'var(--ink-3)' }}>
                Gestión
              </div>
            )}
            <ul className={cn("space-y-1", isCollapsed && "flex flex-col items-center gap-2")}>
              {navItems.map((item) => (
                <li key={item.to} className={isCollapsed ? "w-12" : ""}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    onClick={closeMobileMenu}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center transition-all duration-200 group relative rounded-lg',
                        isCollapsed
                          ? 'justify-center p-3'
                          : 'gap-3 px-4 py-2.5 text-sm font-medium',
                        isActive
                          ? 'font-semibold'
                          : 'hover:bg-white/40'
                      )
                    }
                    style={({ isActive }) => ({
                      color: isActive ? 'var(--ink-1)' : 'var(--ink-2)',
                      background: isActive ? 'rgba(250, 204, 21, 0.12)' : undefined,
                    })}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          size={18}
                          strokeWidth={isActive ? 2.1 : 1.7}
                          style={{ color: isActive ? 'var(--accent)' : 'var(--ink-3)', flexShrink: 0 }}
                        />
                        {!isCollapsed && (
                          <>
                            <span className="flex-1">{item.label}</span>
                            {isActive && (
                              <span
                                className="text-[8px] font-mono font-semibold tracking-wide opacity-40 transition-opacity duration-200"
                                style={{ color: 'var(--ink-2)' }}
                              >
                                {item.code}
                              </span>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div
        className={cn(
          "border-t transition-all duration-300",
          isCollapsed ? "px-2 py-4" : "px-4 py-5"
        )}
        style={{ borderColor: 'var(--border)' }}
      >
        {isCollapsed ? (
          // Collapsed: Icon-only layout
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
              title={user?.name ?? 'Usuario'}
            >
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg transition-colors duration-200 hover:bg-white/40"
              style={{ color: 'var(--ink-2)' }}
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          // Expanded: Full layout
          <>
            {/* User profile */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
              >
                {user?.name?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: 'var(--ink-1)' }}>
                  {user?.name ?? 'Usuario'}
                </div>
                <div className="text-xs truncate" style={{ color: 'var(--ink-3)' }}>
                  Admin
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className={styles.logoutButton}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Cerrar sesión</span>
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
