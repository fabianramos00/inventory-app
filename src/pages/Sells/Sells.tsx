import { Plus, Search } from 'lucide-react'
import styles from './Sells.module.css'

const mockSales = [
  { id: 1, code: 'VNT-0124', customer: 'Pedro Huanca', items: 3, total: 240.00, user: 'María R.', date: '25/02/2026', status: 'completada' },
  { id: 2, code: 'VNT-0123', customer: 'Luis Torres', items: 1, total: 89.50, user: 'Luis P.', date: '25/02/2026', status: 'completada' },
  { id: 3, code: 'VNT-0122', customer: 'Rosa Mamani', items: 5, total: 512.30, user: 'María R.', date: '24/02/2026', status: 'completada' },
  { id: 4, code: 'VNT-0121', customer: 'Empresa Construfix', items: 12, total: 1840.00, user: 'Carlos M.', date: '24/02/2026', status: 'anulada' },
  { id: 5, code: 'VNT-0120', customer: 'Jhon Quispe', items: 2, total: 74.20, user: 'Luis P.', date: '23/02/2026', status: 'completada' },
]

const totalHoy = mockSales
  .filter(s => s.date === '25/02/2026' && s.status === 'completada')
  .reduce((acc, s) => acc + s.total, 0)

export default function Sells() {
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <span className="bin-label mb-1 inline-block">VNT / Registro</span>
          <h2 className={styles.title}>Ventas</h2>
        </div>
        <button className={styles.headerActions}>
          <Plus size={13} /> Nueva Venta
        </button>
      </div>

      {/* Summary strip */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryValue}>
            $ {totalHoy.toFixed(2)}
          </div>
          <div className={styles.summaryLabel}>Ventas de hoy</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryValue}>
            {mockSales.filter(s => s.status === 'completada').length}
          </div>
          <div className={styles.summaryLabel}>Transacciones</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryValueDestructive}>
            {mockSales.filter(s => s.status === 'anulada').length}
          </div>
          <div className={styles.summaryLabel}>Anuladas</div>
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchCard}>
        <div className={styles.searchWrapper}>
          <Search size={14} className={styles.searchIcon} />
          <input type="text" className={styles.searchInput} placeholder="Buscar por código o cliente..." />
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className="overflow-x-auto w-full">
          <table className="data-table w-full min-w-[700px]">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Ítems</th>
                <th>Total</th>
                <th>Usuario</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {mockSales.map(s => (
                <tr key={s.id}>
                  <td><span className={styles.codeCell}>{s.code}</span></td>
                  <td><span className={styles.customerCell}>{s.customer}</span></td>
                  <td><span className={styles.itemsCell}>{s.items}</span></td>
                  <td>
                    <span className={styles.totalCell}>
                      $ {s.total.toFixed(2)}
                    </span>
                  </td>
                  <td><span className={styles.userCell}>{s.user}</span></td>
                  <td><span className={styles.dateCell}>{s.date}</span></td>
                  <td>
                    <span className={`badge ${s.status === 'completada' ? 'badge--success' : 'badge--destructive'}`}>
                      {s.status === 'completada' ? 'Completada' : 'Anulada'}
                    </span>
                  </td>
                  <td>
                    <button className={styles.actionBtn}>
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
