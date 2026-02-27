import { Package, Truck, ShoppingCart, ClipboardList, TrendingUp, AlertTriangle } from 'lucide-react'
import styles from './Dashboard.module.css'

const stats = [
  { label: 'Productos en Stock', value: '1,284', delta: '+12 esta semana', icon: Package, color: '#FACC15' },
  { label: 'Ventas Hoy', value: '$ 3,420', delta: '+8.4% vs ayer', icon: ShoppingCart, color: '#16A34A' },
  { label: 'Pedidos Pendientes', value: '7', delta: '2 urgentes', icon: ClipboardList, color: '#D97706' },
  { label: 'Proveedores Activos', value: '23', delta: '1 nuevo este mes', icon: Truck, color: '#2563EB' },
]

const recentActivity = [
  { id: 1, type: 'venta', desc: 'Venta #VNT-0124 registrada', user: 'María R.', time: 'Hace 5 min', amount: '$ 240.00' },
  { id: 2, type: 'pedido', desc: 'Pedido #PED-0089 recibido', user: 'Carlos M.', time: 'Hace 23 min', amount: '$ 1,840.00' },
  { id: 3, type: 'stock', desc: 'Stock bajo: Tornillos M8 (4 unid.)', user: 'Sistema', time: 'Hace 1h', amount: null },
  { id: 4, type: 'venta', desc: 'Venta #VNT-0123 registrada', user: 'Luis P.', time: 'Hace 2h', amount: '$ 89.50' },
  { id: 5, type: 'pedido', desc: 'Pedido #PED-0088 creado', user: 'María R.', time: 'Hace 3h', amount: '$ 560.00' },
]

const lowStock = [
  { sku: 'TRN-M8-GV', name: 'Tornillos M8 Galvanizados', stock: 4, min: 20, unit: 'pzas' },
  { sku: 'LLV-15MM', name: 'Llave Ajustable 15mm', stock: 1, min: 5, unit: 'pzas' },
  { sku: 'CIN-ACERO-5M', name: 'Cinta Métrica Acero 5m', stock: 6, min: 10, unit: 'pzas' },
]

export default function Dashboard() {
  return (
    <div className={styles.container}>
      {/* KPI Cards */}
      <div className={styles.statsGrid}>
        {stats.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statHeader}>
              <div
                className={styles.statIconBox}
                style={{ background: `${s.color}18` }}
              >
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <TrendingUp size={13} className={styles.statTrending} />
            </div>
            <div>
              <div className={styles.statValue}>
                {s.value}
              </div>
              <div className={styles.statLabel}>
                {s.label}
              </div>
            </div>
            <div className={styles.statDelta}>
              {s.delta}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.contentGrid}>
        {/* Activity Feed */}
        <div className={styles.feedCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <span className="bin-label">ACT</span>
              <span className={styles.cardTitle}>Actividad Reciente</span>
            </div>
            <button className={styles.viewAllBtn}>Ver todo</button>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="data-table w-full min-w-[600px]">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Usuario</th>
                  <th>Monto</th>
                  <th>Hora</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span className={styles.feedDesc}>{a.desc}</span>
                    </td>
                    <td>
                      <span className={styles.feedUser}>{a.user}</span>
                    </td>
                    <td>
                      {a.amount ? (
                        <span className={styles.feedAmount}>
                          {a.amount}
                        </span>
                      ) : (
                        <span className="badge badge--warning">Alerta</span>
                      )}
                    </td>
                    <td>
                      <span className={styles.feedTime}>{a.time}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className={styles.alertCard}>
          <div className={styles.alertHeader}>
            <AlertTriangle size={15} className={styles.alertIcon} />
            <span className="bin-label">ALERTA</span>
            <span className={styles.cardTitle}>Stock Bajo</span>
          </div>
          <div className={styles.alertList}>
            {lowStock.map((item) => (
              <div key={item.sku} className={styles.alertItem}>
                <div className={styles.alertItemHeader}>
                  <span className={styles.alertSku}>{item.sku}</span>
                  <span className="badge badge--destructive">{item.stock} {item.unit}</span>
                </div>
                <div className={styles.alertName}>{item.name}</div>
                {/* Stock bar */}
                <div className={styles.alertBarBg}>
                  <div
                    className={styles.alertBarFill}
                    style={{
                      width: `${Math.min((item.stock / item.min) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className={styles.alertMin}>
                  Mínimo: {item.min} {item.unit}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
