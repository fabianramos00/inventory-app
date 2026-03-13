import type { ReactNode } from 'react'
import { Loader } from 'lucide-react'
import styles from './DataTable.module.css'
import Pagination from '@/components/Pagination'

interface DataTableProps {
  children: ReactNode
  loading: boolean
  empty: boolean
  loadingText?: string
  emptyText?: string
  minWidth?: string
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  isPaginationLoading?: boolean
}

export default function DataTable({
  children,
  loading,
  empty,
  loadingText = 'Cargando datos...',
  emptyText = 'No se encontraron registros.',
  minWidth,
  currentPage,
  totalPages,
  onPageChange,
  isPaginationLoading,
}: DataTableProps) {
  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Loader size={24} className={styles.spinner} />
        <p>{loadingText}</p>
      </div>
    )
  }

  if (empty) {
    return <div className={styles.emptyState}>{emptyText}</div>
  }

  const hasPagination =
    currentPage !== undefined &&
    totalPages !== undefined &&
    onPageChange !== undefined

  return (
    <>
      <div className="overflow-x-auto w-full">
        <table
          className="data-table w-full"
          style={minWidth ? { minWidth } : undefined}
        >
          {children}
        </table>
      </div>
      {hasPagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          isLoading={isPaginationLoading}
        />
      )}
    </>
  )
}
