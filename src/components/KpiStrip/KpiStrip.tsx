import type { LucideIcon } from 'lucide-react'
import styles from './KpiStrip.module.css'

export interface KpiCardConfig {
  label: string
  value: string | number
  icon: LucideIcon
  variant: 'accent' | 'success' | 'warning' | 'destructive' | 'blue'
  prefix?: string
  valueColor?: string
}

const variantClass: Record<string, string> = {
  accent:      styles.kpiIconWrapperAccent,
  success:     styles.kpiIconWrapperSuccess,
  warning:     styles.kpiIconWrapperWarning,
  destructive: styles.kpiIconWrapperDestructive,
  blue:        styles.kpiIconWrapperBlue,
}

export default function KpiStrip({ cards }: { cards: KpiCardConfig[] }) {
  return (
    <div className={styles.kpiStrip}>
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.label} className={styles.kpiItem}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>{card.label}</span>
              <div className={`${styles.kpiIconWrapper} ${variantClass[card.variant]}`}>
                <Icon size={16} />
              </div>
            </div>
            <div
              className={styles.kpiValue}
              style={card.valueColor ? { color: card.valueColor } : undefined}
            >
              {card.prefix && <span className={styles.currencySymbol}>{card.prefix}</span>}
              {card.value}
            </div>
          </div>
        )
      })}
    </div>
  )
}
