import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Loader } from 'lucide-react'
import styles from './Dropdown.module.css'

export interface DropdownOption {
  value: string
  label: string
}

interface DropdownProps {
  value: string
  options: DropdownOption[]
  onChange: (value: string) => void
  placeholder?: string
  isLoading?: boolean
  onOpen?: () => void | Promise<void>
  isControlled?: boolean
  onOpenChange?: (isOpen: boolean) => void
  disabled?: boolean
}

export default function Dropdown({
  value,
  options,
  onChange,
  placeholder = 'Seleccionar...',
  isLoading = false,
  onOpen,
  isControlled = false,
  onOpenChange,
  disabled = false,
}: DropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isOpen = isControlled ? onOpenChange ? false : internalOpen : internalOpen

  function handleToggle() {
    if (disabled) return

    const newOpen = !internalOpen
    setInternalOpen(newOpen)

    if (newOpen && onOpen) {
      setLoading(true)
      try {
        const result = onOpen()
        if (result instanceof Promise) {
          result.finally(() => setLoading(false))
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error in dropdown onOpen:', error)
        setLoading(false)
      }
    }

    if (onOpenChange) {
      onOpenChange(newOpen)
    }
  }

  function handleSelectOption(optionValue: string) {
    onChange(optionValue)
    if (!isControlled) {
      setInternalOpen(false)
    }
    if (onOpenChange) {
      onOpenChange(false)
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (!isControlled) {
          setInternalOpen(false)
        }
        if (onOpenChange) {
          onOpenChange(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isControlled, onOpenChange])

  const selectedOption = options.find(opt => opt.value === value)
  const displayLabel = selectedOption?.label || placeholder

  return (
    <div className={styles.selectDropdown} ref={dropdownRef}>
      <button
        type="button"
        className={`${styles.selectTrigger} ${value ? styles.selectTriggerActive : ''} ${disabled ? styles.selectTriggerDisabled : ''}`}
        onClick={handleToggle}
        disabled={disabled}
      >
        <span>{displayLabel}</span>
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div className={styles.selectContent}>
          <div className={styles.selectOptions}>
            {loading || isLoading ? (
              <div className={styles.loadingOption}>
                <Loader size={16} className={styles.loadingSpinner} />
              </div>
            ) : options.length === 0 ? (
              <div className={styles.emptyOption}>No hay opciones disponibles</div>
            ) : (
              options.map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.selectOption} ${value === option.value ? styles.selectOptionActive : ''}`}
                  onClick={() => handleSelectOption(option.value)}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
