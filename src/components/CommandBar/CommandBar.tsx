import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import styles from './CommandBar.module.css'

interface CommandBarProps {
  search: string
  onSearchChange: (val: string) => void
  placeholder?: string
  children?: ReactNode
}

export default function CommandBar({ search, onSearchChange, placeholder = 'Buscar...', children }: CommandBarProps) {
  return (
    <div className={styles.commandBar}>
      <div className={styles.controlsBar}>
        <div className={styles.searchWrapper}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder={placeholder}
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
        {children}
      </div>
    </div>
  )
}
