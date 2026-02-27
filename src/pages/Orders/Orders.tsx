import { Plus } from 'lucide-react'
import styles from './Orders.module.css'

type Status = 'PENDIENTE' | 'RECIBIDO' | 'CANCELADO'

const mockOrders = [
  { id: 1, code: 'PED-0089', provider: 'Distribuidora Metálica SAC', items: 6, total: 1840.00, status: 'RECIBIDO' as Status, date: '24/02/2026' },
  { id: 2, code: 'PED-0090', provider: 'Ferretería Central Lima', items: 3, total: 560.00, status: 'PENDIENTE' as Status, date: '25/02/2026' },
  { id: 3, code: 'PED-0091', provider: 'Suministros Industriales Norte', items: 8, total: 2300.00, status: 'PENDIENTE' as Status, date: '25/02/2026' },
  { id: 4, code: 'PED-0088', provider: 'Importadora Andina Tools', items: 2, total: 780.00, status: 'CANCELADO' as Status, date: '22/02/2026' },
  { id: 5, code: 'PED-0087', provider: 'Distribuidora Metálica SAC', items: 4, total: 1120.00, status: 'RECIBIDO' as Status, date: '20/02/2026' },
]

const statusClass: Record<Status, string> = {
  PENDIENTE: 'badge--warning',
  RECIBIDO: 'badge--success',
  CANCELADO: 'badge--destructive',
}

const statusLabel: Record<Status, string> = {
  PENDIENTE: 'Pendiente',
  RECIBIDO: 'Recibido',
  CANCELADO: 'Cancelado',
}

export default function Orders() {
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <span className="bin-label mb-1 inline-block">PED / Órdenes</span>
          <h2 className={styles.title}>Pedidos de Compra</h2>
        </div>
        <button className={styles.headerActions}>
          <Plus size={13} /> Nuevo Pedido
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="overflow-x-auto w-full pb-2 -mb-2">
        <div className={styles.filterTabs}>
          {(['Todos', 'Pendiente', 'Recibido', 'Cancelado'] as const).map(tab => (
            <button
              key={tab}
              className={`${styles.filterTab} ${tab === 'Todos' ? styles.filterTabActive : styles.filterTabInactive} whitespace-nowrap`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className="overflow-x-auto w-full">
          <table className="data-table w-full min-w-[700px]">
            <thead>
              <tr>
                <th>Código</th>
                <th>Proveedor</th>
                <th>Ítems</th>
                <th>Total</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {mockOrders.map(o => (
                <tr key={o.id}>
                  <td><span className={styles.codeCell}>{o.code}</span></td>
                  <td><span className={styles.providerCell}>{o.provider}</span></td>
                  <td><span className={styles.itemsCell}>{o.items}</span></td>
                  <td>
                    <span className={styles.totalCell}>
                      $ {o.total.toFixed(2)}
                    </span>
                  </td>
                  <td><span className={styles.dateCell}>{o.date}</span></td>
                  <td><span className={`badge ${statusClass[o.status]}`}>{statusLabel[o.status]}</span></td>
                  <td>
                    <div className={styles.actionsContainer}>
                      <button className={styles.viewBtn}>
                        Ver
                      </button>
                      {o.status === 'PENDIENTE' && (
                        <button className={styles.receiveBtn}>
                          Recibir
                        </button>
                      )}
                    </div>
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
