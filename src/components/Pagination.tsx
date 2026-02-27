import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './Pagination.module.css'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const prevButtonRef = useRef<HTMLButtonElement>(null)
  const nextButtonRef = useRef<HTMLButtonElement>(null)

  const canGoPrev = currentPage > 1
  const canGoNext = currentPage < totalPages

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return

      if (e.key === 'ArrowLeft' || e.key === 'k' || e.key === 'K') {
        if (canGoPrev) {
          e.preventDefault()
          onPageChange(currentPage - 1)
        }
      } else if (e.key === 'ArrowRight' || e.key === 'j' || e.key === 'J') {
        if (canGoNext) {
          e.preventDefault()
          onPageChange(currentPage + 1)
        }
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('keydown', handleKeyDown)
      return () => container.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentPage, totalPages, canGoPrev, canGoNext, onPageChange, isLoading])

  if (totalPages <= 1) return null

  return (
    <nav
      className={styles.pagination}
      aria-label="Paginación"
      ref={containerRef}
      tabIndex={0}
    >
      <button
        ref={prevButtonRef}
        className={styles.paginationBtn}
        onClick={() => canGoPrev && onPageChange(currentPage - 1)}
        disabled={!canGoPrev || isLoading}
        aria-label="Ir a página anterior"
      >
        <ChevronLeft size={16} />
        <span className={styles.btnText}>Anterior</span>
      </button>

      <span className={styles.paginationInfo}>
        Página {currentPage} de {totalPages}
      </span>

      <button
        ref={nextButtonRef}
        className={styles.paginationBtn}
        onClick={() => canGoNext && onPageChange(currentPage + 1)}
        disabled={!canGoNext || isLoading}
        aria-label="Ir a página siguiente"
      >
        <span className={styles.btnText}>Siguiente</span>
        <ChevronRight size={16} />
      </button>
    </nav>
  )
}
