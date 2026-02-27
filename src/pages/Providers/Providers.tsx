import { useState } from 'react'
import { Search, Plus, Phone, Mail } from 'lucide-react'
import styles from './Providers.module.css'

const mockProviders = [
  { id: 1, name: 'Distribuidora Metálica SAC', contact: 'Juan Pérez', email: 'jperez@distmet.pe', phone: '+51 999 123 456', products: 34, status: true },
  { id: 2, name: 'Ferretería Central Lima', contact: 'Ana Gómez', email: 'agomez@fclima.pe', phone: '+51 998 654 321', products: 21, status: true },
  { id: 3, name: 'Suministros Industriales Norte', contact: 'Roberto Silva', email: 'rsilva@sin.pe', phone: '+51 997 000 111', products: 15, status: true },
  { id: 4, name: 'Importadora Andina Tools', contact: 'Carmen Vega', email: 'cvega@iat.pe', phone: '+51 996 777 888', products: 8, status: false },
  { id: 5, name: 'Comercial Herramientas del Sur', contact: 'Diego Lara', email: 'dlara@chs.pe', phone: '+51 995 444 222', products: 19, status: true },
]

export default function Providers() {
  const [search, setSearch] = useState('')

  const filtered = mockProviders.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.contact.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <span className="bin-label mb-1 inline-block">PROV / Lista</span>
          <h2 className={styles.title}>Proveedores</h2>
        </div>
        <button className={styles.headerActions}>
          <Plus size={13} /> Nuevo Proveedor
        </button>
      </div>

      {/* Search */}
      <div className={styles.searchCard}>
        <div className={styles.searchWrapper}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar proveedor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Cards grid */}
      <div className={styles.gridContainer}>
        {filtered.map(p => (
          <div key={p.id} className={styles.providerCard}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.providerName}>{p.name}</div>
                <div className={styles.providerContact}>{p.contact}</div>
              </div>
              <span className={`badge ${p.status ? 'badge--success' : 'badge--neutral'}`}>
                {p.status ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <div className={styles.detailsList}>
              <div className={styles.detailItem}>
                <Mail size={12} className={styles.detailIcon} />
                {p.email}
              </div>
              <div className={styles.detailItem}>
                <Phone size={12} className={styles.detailIcon} />
                {p.phone}
              </div>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.productCount}>
                <span className={styles.productNumber}>{p.products}</span> productos
              </div>
              <div className={styles.actionButtons}>
                <button className={styles.actionBtn}>Editar</button>
                <button className={styles.actionBtn}>Ver</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
