import { NavLink, useNavigate } from 'react-router-dom'
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
  { to: '/sales', label: 'Ventas', icon: ShoppingCart, code: 'VNT' },
  { to: '/orders', label: 'Pedidos', icon: ClipboardList, code: 'PED' },
  { to: '/users', label: 'Usuarios', icon: Users, code: 'USR' },
]

interface SidebarProps {
  isMobileMenuOpen?: boolean;
  closeMobileMenu?: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export default function Sidebar({ isMobileMenuOpen, closeMobileMenu, isCollapsed, toggleCollapse }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-full flex flex-col z-30 transition-all duration-300 ease-in-out md:translate-x-0 cursor-default",
        isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}
      style={{
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
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
      <nav className={cn("flex-1 overflow-y-auto transition-all duration-300", isCollapsed ? "py-4" : "py-6")}>
        <div className="space-y-6">
          {/* Section header */}
          <div>
            {!isCollapsed && (
              <div
                className="text-[10px] font-bold uppercase tracking-[0.05em] px-6 mb-3"
                style={{ color: 'var(--ink-3)' }}
              >
                Gestión
              </div>
            )}
            <ul className="flex flex-col">
              {navItems.map((item) => (
                <li key={item.to} className="w-full">
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    onClick={closeMobileMenu}
                    className={() =>
                      cn(
                        'flex items-center transition-all duration-150 group relative',
                        isCollapsed
                          ? 'justify-center p-4'
                          : 'gap-3 px-6 py-3 text-[13px] font-medium'
                      )
                    }
                    style={({ isActive }) => ({
                      color: isActive ? 'var(--ink-1)' : 'var(--ink-2)',
                      background: isActive ? 'var(--surface-2)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                    })}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          size={16}
                          strokeWidth={isActive ? 2 : 1.5}
                          style={{
                            color: isActive ? 'var(--accent)' : 'var(--ink-3)',
                            flexShrink: 0,
                            transition: 'color 150ms ease'
                          }}
                        />
                        {!isCollapsed && (
                          <>
                            <span className="flex-1 group-hover:text-[var(--ink-1)] transition-colors">{item.label}</span>
                            <span
                              className={cn(
                                "text-[10px] font-mono font-medium tracking-wide transition-opacity duration-200",
                                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                              )}
                              style={{ color: 'var(--ink-3)' }}
                            >
                              {item.code}
                            </span>
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
          isCollapsed ? "p-4" : "p-6"
        )}
        style={{ borderColor: 'var(--border)' }}
      >
        {isCollapsed ? (
          // Collapsed: Icon-only layout
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-8 h-8 rounded-sm flex items-center justify-center text-[10px] font-bold"
              style={{ background: 'var(--surface-2)', color: 'var(--ink-2)' }}
              title={user?.full_name ?? 'Usuario'}
            >
              {user?.full_name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <button
              onClick={handleLogout}
              className={styles.logoutButtonIcon}
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          // Expanded: Full layout
          <>
            {/* User profile */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-8 h-8 rounded-sm flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ background: 'var(--surface-2)', color: 'var(--ink-2)' }}
              >
                {user?.full_name?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink-1)' }}>
                  {user?.full_name ?? 'Usuario'}
                </div>
                <div className="text-[11px] font-mono truncate" style={{ color: 'var(--ink-3)' }}>
                  {user?.is_superuser ? 'ADMIN' : 'USUARIO'}
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className={styles.logoutButton}
            >
              <LogOut size={14} className={styles.logoutIcon} />
              <span className="text-[12px] uppercase tracking-wider font-semibold">Cerrar Sesión</span>
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
