import { useState, useEffect } from 'react'
import { Package, DollarSign, ClipboardList, ShoppingCart } from 'lucide-react'
import {
  PieChart, Pie, Tooltip, Legend, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, ResponsiveContainer,
} from 'recharts'
import { dashboardApi, type SalesTrendData, type TopProduct, type OrderStatusData } from '@/lib/api/dashboard'
import { inventoryApi } from '@/lib/api/inventory'
import styles from './Dashboard.module.css'

// Chart color constants (Recharts cannot read CSS vars)
const COLOR_ACCENT = '#FACC15'
const COLOR_SUCCESS = '#16A34A'
const COLOR_WARNING = '#D97706'
const COLOR_BLUE = '#2563EB'
const COLOR_INK3 = '#9B9B8E'

// Order status mapping
const STATUS_MAP: Record<string, { name: string; color: string }> = {
  pending: { name: 'Pendiente', color: COLOR_WARNING },
  sent: { name: 'Enviado', color: COLOR_BLUE },
  received: { name: 'Recibido', color: COLOR_SUCCESS },
  cancelled: { name: 'Cancelado', color: COLOR_INK3 },
}

// Mock recent activity - replace with API call if endpoint exists
const recentActivity = [
  { id: 1, desc: 'Venta #VNT-0124 registrada', user: 'María R.', time: 'Hace 5 min', amount: '3,420.00' },
  { id: 2, desc: 'Pedido #PED-0089 recibido', user: 'Carlos M.', time: 'Hace 23 min', amount: '1,840.00' },
  { id: 3, desc: 'Stock bajo: Tornillos M8', user: 'Sistema', time: 'Hace 1h', amount: null },
  { id: 4, desc: 'Venta #VNT-0123 registrada', user: 'Luis P.', time: 'Hace 2h', amount: '89.50' },
  { id: 5, desc: 'Pedido #PED-0088 creado', user: 'María R.', time: 'Hace 3h', amount: '560.00' },
]

// Helper: convert date to Spanish day name
function getSpanishDayName(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const dayIndex = date.getUTCDay()
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  return days[dayIndex]
}

function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx?: number; cy?: number; midAngle?: number; innerRadius?: number; outerRadius?: number; percent?: number
}) {
  if (!cx || !cy || !midAngle || !innerRadius || !outerRadius || !percent || percent < 0.08) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function Dashboard() {
  // Summary data
  const [summary, setSummary] = useState({
    inventory_value: 0,
    total_sales_today: 0,
    pending_orders: 0,
    delivered_orders: 0,
    pending_payment_sales: 0,
  })
  const [weeklyData, setWeeklyData] = useState<Array<{ dia: string; ventas: number; pedidos: number }>>([])
  const [topProductsData, setTopProductsData] = useState<Array<{ name: string; ventas: number }>>([])
  const [orderStatusData, setOrderStatusData] = useState<Array<{ name: string; value: number; color: string }>>([])
  const [lowStock, setLowStock] = useState<Array<{ sku: string; name: string; stock: number; min: number; unit: string }>>([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true)

        const newErrors: Record<string, string> = {}

        // Load summary
        try {
          const summaryRes = await dashboardApi.getSummary()
          setSummary(summaryRes.data)
        } catch (error) {
          console.error('Failed to load summary:', error)
          newErrors.summary = 'No se pudieron cargar los datos de resumen'
        }

        // Load sales trend
        try {
          const trendRes = await dashboardApi.getSalesTrend()
          if (trendRes.data.data && trendRes.data.data.length > 0) {
            const weeklyTransformed = trendRes.data.data.map((item: SalesTrendData) => ({
              dia: getSpanishDayName(item.date),
              ventas: item.sales_amount,
              pedidos: item.orders_cost,
            }))
            setWeeklyData(weeklyTransformed)
          } else {
            newErrors.salesTrend = 'Sin datos de tendencia de ventas'
          }
        } catch (error) {
          console.error('Failed to load sales trend:', error)
          newErrors.salesTrend = 'Error al cargar tendencia de ventas'
        }

        // Load top products
        try {
          const productsRes = await dashboardApi.getTopProducts()
          if (productsRes.data.products && productsRes.data.products.length > 0) {
            const topProductsTransformed = productsRes.data.products.map((p: TopProduct) => ({
              name: p.product_name,
              ventas: p.total_quantity_sold,
            }))
            setTopProductsData(topProductsTransformed)
          } else {
            newErrors.topProducts = 'Sin productos vendidos'
          }
        } catch (error) {
          console.error('Failed to load top products:', error)
          newErrors.topProducts = 'Error al cargar productos principales'
        }

        // Load order status distribution
        try {
          const statusRes = await dashboardApi.getOrderStatusDistribution()
          if (statusRes.data.data && statusRes.data.data.length > 0) {
            const orderStatusTransformed = statusRes.data.data.map((item: OrderStatusData) => {
              const status = STATUS_MAP[item.status] || { name: item.status, color: COLOR_INK3 }
              return {
                name: status.name,
                value: item.count,
                color: status.color,
              }
            })
            setOrderStatusData(orderStatusTransformed)
          } else {
            newErrors.orderStatus = 'Sin pedidos para mostrar'
          }
        } catch (error) {
          console.error('Failed to load order status:', error)
          newErrors.orderStatus = 'Error al cargar estado de pedidos'
        }

        // Load low stock
        try {
          const lowStockRes = await inventoryApi.getProducts({ skip: 0, limit: 10, stock_status: 'low_stock' })
          if (lowStockRes.data.items && lowStockRes.data.items.length > 0) {
            const lowStockTransformed = lowStockRes.data.items.map((item: any) => ({
              sku: item.sku,
              name: item.name,
              stock: item.stock_quantity,
              min: item.low_stock_threshold,
              unit: item.measurement_unit?.name || 'pzas',
            }))
            setLowStock(lowStockTransformed)
          } else {
            newErrors.lowStock = 'Todos los productos tienen stock suficiente'
          }
        } catch (error) {
          console.error('Failed to load low stock:', error)
          newErrors.lowStock = 'Error al cargar productos con stock bajo'
        }

        setErrors(newErrors)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <div className={styles.breadcrumb}>
            <span>DSH</span>
            <span className={styles.breadcrumbDivider}>/</span>
            <span className={styles.breadcrumbActive}>Resumen</span>
          </div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-3)' }}>
          Cargando datos...
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.breadcrumb}>
          <span>DSH</span>
          <span className={styles.breadcrumbDivider}>/</span>
          <span className={styles.breadcrumbActive}>Resumen</span>
        </div>
        <h1 className={styles.pageTitle}>Dashboard</h1>
      </div>

      {/* KPI Strip */}
      <div className={styles.kpiStrip}>
        <div className={styles.kpiItem}>
          <div className={styles.kpiHeader}>
            <Package size={14} className={styles.kpiIconAccent} />
            <span className={styles.kpiLabel}>Valor Total Inventario</span>
          </div>
          <div className={styles.kpiValue}>
            <span className={styles.currencySymbol}>$</span>
            {summary.inventory_value.toLocaleString('es-PE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>

        <div className={styles.kpiDivider} />

        <div className={styles.kpiItem}>
          <div className={styles.kpiHeader}>
            <DollarSign size={14} className={styles.kpiIconSuccess} />
            <span className={styles.kpiLabel}>Ingresos de Hoy</span>
          </div>
          <div className={styles.kpiValue}>
            <span className={styles.currencySymbol}>$</span>
            {summary.total_sales_today.toLocaleString('es-PE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>

        <div className={styles.kpiDivider} />

        <div className={styles.kpiItem}>
          <div className={styles.kpiHeader}>
            <ClipboardList size={14} className={styles.kpiIconWarning} />
            <span className={styles.kpiLabel}>Pedidos Pendientes</span>
          </div>
          <div className={styles.kpiValue}>{summary.pending_orders}</div>
        </div>

        <div className={styles.kpiDivider} />

        <div className={styles.kpiItem}>
          <div className={styles.kpiHeader}>
            <ShoppingCart size={14} className={styles.kpiIconDestructive} />
            <span className={styles.kpiLabel}>Ventas Sin Pagar</span>
          </div>
          <div className={styles.kpiValue}>
            {summary.pending_payment_sales.toLocaleString('es-PE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        {/* Line: Ventas y Pedidos Últimos 7 Días */}
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Ventas y Pedidos — Últimos 7 Días</span>
          </div>
          <div className={styles.chartBody}>
            {errors.salesTrend ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260, color: 'var(--ink-3)', fontSize: '14px' }}>
                {errors.salesTrend}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={weeklyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="dia"
                  tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    padding: '8px 12px',
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={6}
                  wrapperStyle={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    paddingBottom: '20px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="ventas"
                  name="Ventas"
                  stroke={COLOR_SUCCESS}
                  strokeWidth={3}
                  dot={{ r: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="pedidos"
                  name="Pedidos"
                  stroke={COLOR_WARNING}
                  strokeWidth={3}
                  dot={{ r: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Horizontal Bar: Top Productos Vendidos */}
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Top Productos Vendidos</span>
          </div>
          <div className={styles.chartBody}>
            {errors.topProducts ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260, color: 'var(--ink-3)', fontSize: '14px' }}>
                {errors.topProducts}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
              <BarChart
                layout="vertical"
                data={topProductsData}
                margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis
                  type="number"
                  hide
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar
                  dataKey="ventas"
                  fill={COLOR_ACCENT}
                  radius={[0, 4, 4, 0]}
                  barSize={18}
                  label={{ position: 'right', fontSize: 11, fontWeight: 700, fill: '#64748B' }}
                />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie: Estado de Pedidos */}
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Estado de Pedidos</span>
          </div>
          <div className={styles.chartBody}>
            {errors.orderStatus ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260, color: 'var(--ink-3)', fontSize: '14px' }}>
                {errors.orderStatus}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                  label={renderPieLabel}
                >
                  {orderStatusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={6}
                  wrapperStyle={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className={styles.tablesRow}>
        {/* Activity table */}
        <div className={styles.tableCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Actividad Reciente</span>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="data-table w-full min-w-[480px]">
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
                    <td><span className={styles.feedDesc}>{a.desc}</span></td>
                    <td><span className={styles.feedUser}>{a.user}</span></td>
                    <td>
                      {a.amount
                        ? <span className={styles.feedAmount}>$ {a.amount}</span>
                        : <span className="badge badge--warning">Alerta</span>
                      }
                    </td>
                    <td><span className={styles.feedTime}>{a.time}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock list */}
        <div className={styles.tableCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Stock Bajo</span>
          </div>
          {errors.lowStock ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-3)', fontSize: '14px' }}>
              {errors.lowStock}
            </div>
          ) : (
            <div className={styles.alertList}>
              {lowStock.map((item) => (
              <div key={item.sku} className={styles.alertItem}>
                <div className={styles.alertItemHeader}>
                  <span className={styles.alertName}>{item.name}</span>
                  <span className={styles.alertSku}>{item.sku}</span>
                </div>
                <div className={styles.alertBarBg}>
                  <div
                    className={styles.alertBarFill}
                    style={{ width: `${Math.min((item.stock / item.min) * 100, 100)}%` }}
                  />
                </div>
                <div className={styles.alertMin}>
                  <span>Stock: <strong>{item.stock} {item.unit}</strong></span>
                  <span>Mínimo: {item.min} {item.unit}</span>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
