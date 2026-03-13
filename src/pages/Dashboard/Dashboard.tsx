import { useState, useEffect } from 'react'
import { Package, DollarSign, ClipboardList, ShoppingCart, CheckCircle } from 'lucide-react'
import {
  Tooltip, Legend,
  XAxis, YAxis, CartesianGrid,
  AreaChart, Area, ResponsiveContainer,
} from 'recharts'
import { dashboardApi, type SalesTrendData, type TopProduct, type OrderStatusData } from '@/lib/api/dashboard'
import { inventoryApi } from '@/lib/api/inventory'
import styles from './Dashboard.module.css'

// Chart color constants (Recharts cannot read CSS vars)
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

// Helper: convert date to Spanish day name
function getSpanishDayName(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const dayIndex = date.getUTCDay()
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  return days[dayIndex]
}


export default function Dashboard() {
  const [summary, setSummary] = useState({
    inventory_value: 0,
    total_sales_today: 0,
    pending_orders: 0,
    delivered_orders: 0,
    pending_payment_sales: 0,
  })
  const [weeklyData, setWeeklyData] = useState<Array<{ dia: string; ventas: number; pedidos: number }>>([])
  const [topProductsData, setTopProductsData] = useState<Array<{ sku: string; name: string; brand: string; ventas: number; revenue: number }>>([])
  const [orderStatusData, setOrderStatusData] = useState<Array<{ name: string; value: number; percentage: number; color: string }>>([])
  const [lowStock, setLowStock] = useState<Array<{ sku: string; name: string; stock: number; min: number; unit: string }>>([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true)

        const newErrors: Record<string, string> = {}

        try {
          const summaryRes = await dashboardApi.getSummary()
          setSummary(summaryRes.data)
        } catch {
          newErrors.summary = 'No se pudieron cargar los datos de resumen'
        }

        try {
          const trendRes = await dashboardApi.getSalesTrend()
          if (trendRes.data.data && trendRes.data.data.length > 0) {
            setWeeklyData(trendRes.data.data.map((item: SalesTrendData) => ({
              dia: getSpanishDayName(item.date),
              ventas: item.sales_amount,
              pedidos: item.orders_cost,
            })))
          } else {
            newErrors.salesTrend = 'Sin datos de tendencia de ventas'
          }
        } catch {
          newErrors.salesTrend = 'Error al cargar tendencia de ventas'
        }

        try {
          const productsRes = await dashboardApi.getTopProducts()
          if (productsRes.data.products && productsRes.data.products.length > 0) {
            setTopProductsData(productsRes.data.products.map((p: TopProduct) => ({
              sku: p.product_sku,
              name: p.product_name,
              brand: p.brand_name,
              ventas: p.total_quantity_sold,
              revenue: p.total_sales_amount,
            })))
          } else {
            newErrors.topProducts = 'Sin productos vendidos'
          }
        } catch {
          newErrors.topProducts = 'Error al cargar productos principales'
        }

        try {
          const statusRes = await dashboardApi.getOrderStatusDistribution()
          const apiData: Record<string, OrderStatusData> = {}
          ;(statusRes.data.data || []).forEach((item: OrderStatusData) => {
            apiData[item.status] = item
          })
          const total = Object.values(apiData).reduce((sum, item) => sum + item.count, 0)
          setOrderStatusData(
            Object.entries(STATUS_MAP).map(([key, { name, color }]) => {
              const item = apiData[key]
              const count = item?.count ?? 0
              const percentage = total > 0 ? (count / total) * 100 : 0
              return { name, value: count, percentage, color }
            })
          )
        } catch {
          newErrors.orderStatus = 'Error al cargar estado de pedidos'
        }

        try {
          const lowStockRes = await inventoryApi.getProducts({ skip: 0, limit: 10, stock_status: 'low_stock' })
          if (lowStockRes.data.items && lowStockRes.data.items.length > 0) {
            setLowStock(lowStockRes.data.items.map((item: any) => ({
              sku: item.sku,
              name: item.name,
              stock: item.stock_quantity,
              min: item.low_stock_threshold,
              unit: item.measurement_unit?.name || 'pzas',
            })))
          } else {
            newErrors.lowStock = 'Todos los productos tienen stock suficiente'
          }
        } catch {
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

      {/* KPI Strip — 5 cards */}
      <div className={styles.kpiStrip}>
        <div className={styles.kpiItem}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Valor Total Inventario</span>
            <div className={`${styles.kpiIconWrapper} ${styles.kpiIconWrapperAccent}`}>
              <Package size={16} />
            </div>
          </div>
          <div className={styles.kpiValue}>
            <span className={styles.currencySymbol}>$</span>
            {summary.inventory_value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className={styles.kpiItem}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Ingresos de Hoy</span>
            <div className={`${styles.kpiIconWrapper} ${styles.kpiIconWrapperSuccess}`}>
              <DollarSign size={16} />
            </div>
          </div>
          <div className={styles.kpiValue}>
            <span className={styles.currencySymbol}>$</span>
            {summary.total_sales_today.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className={styles.kpiItem}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Pedidos Pendientes</span>
            <div className={`${styles.kpiIconWrapper} ${styles.kpiIconWrapperWarning}`}>
              <ClipboardList size={16} />
            </div>
          </div>
          <div className={styles.kpiValue}>{summary.pending_orders}</div>
        </div>

        <div className={styles.kpiItem}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Pedidos Entregados</span>
            <div className={`${styles.kpiIconWrapper} ${styles.kpiIconWrapperBlue}`}>
              <CheckCircle size={16} />
            </div>
          </div>
          <div className={styles.kpiValue}>{summary.delivered_orders}</div>
        </div>

        <div className={styles.kpiItem}>
          <div className={styles.kpiHeader}>
            <span className={styles.kpiLabel}>Ventas Sin Pagar</span>
            <div className={`${styles.kpiIconWrapper} ${styles.kpiIconWrapperDestructive}`}>
              <ShoppingCart size={16} />
            </div>
          </div>
          <div className={styles.kpiValue}>
            {summary.pending_payment_sales.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Charts Grid — asymmetric: left spans 2 rows */}
      <div className={styles.chartsGrid}>
        {/* Left (tall): Ventas y Pedidos — Últimos 7 Días */}
        <div className={`${styles.chartCard} ${styles.chartCardLeft}`}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Ventas y Pedidos — Últimos 7 Días</span>
          </div>
          <div className={styles.chartBody}>
            {errors.salesTrend ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--ink-3)', fontSize: '14px' }}>
                {errors.salesTrend}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLOR_SUCCESS} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={COLOR_SUCCESS} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradPedidos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLOR_WARNING} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={COLOR_WARNING} stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                    wrapperStyle={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: '20px' }}
                  />
                  <Area type="monotone" dataKey="ventas" name="Ventas" stroke={COLOR_SUCCESS} strokeWidth={2.5} fill="url(#gradVentas)" dot={{ r: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="pedidos" name="Pedidos" stroke={COLOR_WARNING} strokeWidth={2.5} fill="url(#gradPedidos)" dot={{ r: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top right: Estado de Pedidos */}
        <div className={styles.tableCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Estado de Pedidos</span>
          </div>
          {errors.orderStatus ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-3)', fontSize: '14px' }}>
              {errors.orderStatus}
            </div>
          ) : (
            <div className={styles.statusList}>
              {orderStatusData.map((entry) => (
                <div key={entry.name} className={styles.statusRow}>
                  <div className={styles.statusLeft}>
                    <span className={styles.statusDot} style={{ background: entry.color }} />
                    <span className={styles.statusLabel}>{entry.name}</span>
                  </div>
                  <div className={styles.statusRight}>
                    <span className={styles.statusCount}>{entry.value}</span>
                    <span className={styles.statusPill} style={{ background: entry.color + '22', color: entry.color }}>
                      {entry.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom right: Stock Bajo */}
        <div className={`${styles.tableCard} ${styles.stockCard}`}>
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

      {/* Top Productos — full-width table */}
      <div className={styles.tableCard}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>Top Productos Vendidos</span>
        </div>
        {errors.topProducts ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-3)', fontSize: '14px' }}>
            {errors.topProducts}
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Nombre</th>
                  <th>Marca</th>
                  <th>Unidades Vendidas</th>
                  <th>Ingresos Totales</th>
                </tr>
              </thead>
              <tbody>
                {topProductsData.map((p) => (
                  <tr key={p.sku}>
                    <td><span className={styles.productSku}>{p.sku}</span></td>
                    <td><span className={styles.productName}>{p.name}</span></td>
                    <td><span className="badge badge--neutral">{p.brand}</span></td>
                    <td><span className={styles.productUnits}>{p.ventas}</span></td>
                    <td><span className={styles.productRevenue}>$ {p.revenue.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
