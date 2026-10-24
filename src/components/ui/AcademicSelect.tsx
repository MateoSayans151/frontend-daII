import { CaretDown, Check, MagnifyingGlass, X } from '@phosphor-icons/react'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import './AcademicSelect.css'

export type AcademicSelectOption = {
  value: string
  label: string
  code?: string
  description?: string
  meta?: string
  badge?: string
  badgeTone?: 'success' | 'draft' | 'warning' | 'neutral'
}

type AcademicSelectProps = {
  label: string
  value: string
  options: AcademicSelectOption[]
  onChange: (value: string) => void
  placeholder: string
  searchPlaceholder: string
  helperText?: string
  emptyMessage: string
  noResultsMessage?: string
  disabled?: boolean
  loading?: boolean
  clearable?: boolean
}

const normalizar = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()

export function AcademicSelect({
  label,
  value,
  options,
  onChange,
  placeholder,
  searchPlaceholder,
  helperText,
  emptyMessage,
  noResultsMessage = 'No encontramos coincidencias.',
  disabled = false,
  loading = false,
  clearable = false,
}: AcademicSelectProps) {
  const id = useId()
  const triggerId = 'academic-select-' + id
  const listboxId = 'academic-options-' + id
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [open, setOpen] = useState(false)
  const [opensUp, setOpensUp] = useState(false)
  const [query, setQuery] = useState('')
  const selected = options.find((option) => option.value === value)
  const normalizedQuery = normalizar(query.trim())
  const filtered = useMemo(() => options.filter((option) => normalizar([
    option.code, option.label, option.description, option.meta, option.badge,
  ].filter(Boolean).join(' ')).includes(normalizedQuery)), [options, normalizedQuery])

  const close = (restoreFocus = false) => {
    setOpen(false)
    setQuery('')
    if (restoreFocus) triggerRef.current?.focus()
  }

  const openMenu = () => {
    const bounds = triggerRef.current?.getBoundingClientRect()
    const menuHeight = Math.min(window.innerHeight * 0.62, 420)
    setOpensUp(Boolean(bounds && bounds.bottom + menuHeight + 8 > window.innerHeight && bounds.top > menuHeight))
    setQuery('')
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus())
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        setQuery('')
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const focusOption = (index: number) => {
    if (!filtered.length) return
    const next = (index + filtered.length) % filtered.length
    optionRefs.current[next]?.focus()
  }

  const searchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && filtered.length) {
      event.preventDefault()
      const selectedIndex = filtered.findIndex((option) => option.value === value)
      focusOption(selectedIndex >= 0 ? selectedIndex : 0)
    } else if (event.key === 'ArrowUp' && filtered.length) {
      event.preventDefault()
      focusOption(filtered.length - 1)
    } else if (event.key === 'Enter' && filtered.length === 1) {
      event.preventDefault()
      onChange(filtered[0].value)
      close()
    }
  }

  const optionKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusOption(index + 1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusOption(index - 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusOption(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusOption(filtered.length - 1)
    }
  }

  return (
    <div
      className="academic-select"
      ref={rootRef}
      onBlurCapture={(event) => {
        const next = event.relatedTarget as Node | null
        if (!next || !rootRef.current?.contains(next)) close()
      }}
    >
      <label className="academic-select__label" htmlFor={triggerId}>{label}</label>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        className="academic-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open && !loading && filtered.length ? listboxId : undefined}
        aria-describedby={helperText ? triggerId + '-helper' : undefined}
        disabled={disabled}
        onClick={() => {
          if (open) close()
          else openMenu()
        }}
        onKeyDown={(event) => {
          if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault()
            openMenu()
          }
        }}
      >
        <span className="academic-select__summary">
          {selected ? (
            <>
              <span className="academic-select__topline">
                {selected.code && <span className="academic-select__code">{selected.code}</span>}
                <strong className="academic-select__selected-name">{selected.label}</strong>
                {selected.badge && <span className={'academic-select__badge academic-select__badge--' + (selected.badgeTone || 'neutral')}>{selected.badge}</span>}
              </span>
              {selected.description && <small>{selected.description}</small>}
              {selected.meta && <small className="academic-select__meta">{selected.meta}</small>}
            </>
          ) : (
            <>
              <strong className="academic-select__placeholder">{placeholder}</strong>
              <small>Elegí una opción para continuar</small>
            </>
          )}
        </span>
        <CaretDown className={'academic-select__caret' + (open ? ' is-open' : '')} size={19} aria-hidden="true" />
      </button>

      {helperText && <p id={triggerId + '-helper'} className="academic-select__helper">{helperText}</p>}

      {open && (
        <div className={'academic-select__popover' + (opensUp ? ' is-above' : '')}>
          <div className="academic-select__search">
            <MagnifyingGlass size={17} aria-hidden="true" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              aria-controls={!loading && filtered.length ? listboxId : undefined}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={searchKeyDown}
            />
            {query && (
              <button className="academic-select__clear-search" type="button" aria-label="Borrar búsqueda" onClick={() => {
                setQuery('')
                searchRef.current?.focus()
              }}>
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </div>

          {clearable && value && (
            <button className="academic-select__clear-selection" type="button" onClick={() => {
              onChange('')
              close()
            }}>
              Quitar selección
            </button>
          )}

          {loading ? (
            <p className="academic-select__empty" role="status" aria-live="polite">Cargando opciones…</p>
          ) : filtered.length === 0 ? (
            <p className="academic-select__empty" role="status" aria-live="polite">{query ? noResultsMessage : emptyMessage}</p>
          ) : (
            <div className="academic-select__options" id={listboxId} role="listbox" aria-label={label}>
              {filtered.map((option, index) => (
                <button
                  key={option.value}
                  ref={(element) => { optionRefs.current[index] = element }}
                  type="button"
                  role="option"
                  tabIndex={index === 0 ? 0 : -1}
                  aria-selected={option.value === value}
                  className={'academic-select__option' + (option.value === value ? ' is-selected' : '')}
                  onClick={() => {
                    onChange(option.value)
                    close()
                  }}
                  onKeyDown={(event) => optionKeyDown(event, index)}
                >
                  <span className="academic-select__option-copy">
                    <span className="academic-select__topline">
                      {option.code && <span className="academic-select__code">{option.code}</span>}
                      <strong className="academic-select__option-name">{option.label}</strong>
                      {option.badge && <span className={'academic-select__badge academic-select__badge--' + (option.badgeTone || 'neutral')}>{option.badge}</span>}
                    </span>
                    {option.description && <small>{option.description}</small>}
                    {option.meta && <small className="academic-select__meta">{option.meta}</small>}
                  </span>
                  <Check className="academic-select__check" size={17} aria-hidden="true" />
                </button>
              ))}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="academic-select__footer">
              {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
