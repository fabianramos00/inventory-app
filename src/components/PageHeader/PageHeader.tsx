import type { ReactNode } from 'react'
import styles from './PageHeader.module.css'

interface PageHeaderProps {
  prefix: string
  activeLabel: string
  title: string
  action?: ReactNode
}

export default function PageHeader({ prefix, activeLabel, title, action }: PageHeaderProps) {
  return (
    <div className={styles.pageHeader}>
      <div>
        <div className={styles.breadcrumb}>
          <span>{prefix}</span>
          <span className={styles.breadcrumbDivider}>/</span>
          <span className={styles.breadcrumbActive}>{activeLabel}</span>
        </div>
        <h1 className={styles.pageTitle}>{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
