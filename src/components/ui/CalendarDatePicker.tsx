import { CalendarBlank, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import './CalendarDatePicker.css'

const nombresMeses = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' })
const diasSemana = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

function parsearFecha(value: string) {
  if (!value) return null
  const [anio, mes, dia] = value.split('-').map(Number)
  if (!anio || !mes || !dia) return null
  return new Date(anio, mes - 1, dia)
}

function formatearFecha(fecha: Date) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

export function CalendarDatePicker({
  label,
  value,
  onChange,
  placeholder = 'Seleccioná una fecha',
  ariaInvalid = false,
  ariaDescribedBy,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaInvalid?: boolean
  ariaDescribedBy?: string
}) {
  const [abierto, setAbierto] = useState(false)
  const [fechaEnFoco, setFechaEnFoco] = useState(() => value || formatearFecha(new Date()))
  const [mesVisible, setMesVisible] = useState(() => {
    const seleccionada = parsearFecha(value)
    const fecha = seleccionada ?? new Date()
    return new Date(fecha.getFullYear(), fecha.getMonth(), 1)
  })
  const contenedor = useRef<HTMLDivElement>(null)
  const disparador = useRef<HTMLButtonElement>(null)
  const fechaSeleccionada = parsearFecha(value)
  const hoy = new Date()
  const primerDia = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), 1)
  const desplazamiento = (primerDia.getDay() + 6) % 7
  const cantidadDias = new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 0).getDate()
  const celdas = Array.from({ length: 42 }, (_, index) => {
    const dia = index - desplazamiento + 1
    return dia > 0 && dia <= cantidadDias ? dia : null
  })
  const semanas = Array.from({ length: 6 }, (_, index) => celdas.slice(index * 7, index * 7 + 7))

  useEffect(() => {
    if (!abierto) return
    const cerrarAlHacerClickAfuera = (event: PointerEvent) => {
      if (!contenedor.current?.contains(event.target as Node)) setAbierto(false)
    }
    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAbierto(false)
        disparador.current?.focus()
      }
    }
    document.addEventListener('pointerdown', cerrarAlHacerClickAfuera)
    document.addEventListener('keydown', cerrarConEscape)
    return () => {
      document.removeEventListener('pointerdown', cerrarAlHacerClickAfuera)
      document.removeEventListener('keydown', cerrarConEscape)
    }
  }, [abierto])

  useEffect(() => {
    if (!abierto) return
    contenedor.current?.querySelector<HTMLButtonElement>(`[data-calendar-date="${fechaEnFoco}"]`)?.focus()
  }, [abierto, fechaEnFoco, mesVisible])

  const abrir = () => {
    const seleccionada = parsearFecha(value)
    const fecha = seleccionada ?? new Date()
    setMesVisible(new Date(fecha.getFullYear(), fecha.getMonth(), 1))
    setFechaEnFoco(formatearFecha(fecha))
    setAbierto((actual) => !actual)
  }

  const moverFoco = (fecha: Date) => {
    setFechaEnFoco(formatearFecha(fecha))
    setMesVisible(new Date(fecha.getFullYear(), fecha.getMonth(), 1))
  }

  const manejarTecladoFecha = (event: ReactKeyboardEvent<HTMLButtonElement>, fecha: Date) => {
    let destino: Date | null = null
    if (event.key === 'ArrowRight') destino = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1)
    if (event.key === 'ArrowLeft') destino = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() - 1)
    if (event.key === 'ArrowDown') destino = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 7)
    if (event.key === 'ArrowUp') destino = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() - 7)
    if (event.key === 'Home') {
      const desdeLunes = (fecha.getDay() + 6) % 7
      destino = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() - desdeLunes)
    }
    if (event.key === 'End') {
      const hastaDomingo = 6 - ((fecha.getDay() + 6) % 7)
      destino = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + hastaDomingo)
    }
    if (event.key === 'PageUp') destino = new Date(fecha.getFullYear() - (event.shiftKey ? 1 : 0), fecha.getMonth() - (event.shiftKey ? 0 : 1), fecha.getDate())
    if (event.key === 'PageDown') destino = new Date(fecha.getFullYear() + (event.shiftKey ? 1 : 0), fecha.getMonth() + (event.shiftKey ? 0 : 1), fecha.getDate())
    if (destino) {
      event.preventDefault()
      moverFoco(destino)
    }
  }

  return (
    <div className="calendar-picker" ref={contenedor}>
      <span className="calendar-picker__label">{label}</span>
      <button
        ref={disparador}
        className="calendar-picker__trigger"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-label={`${label}: ${fechaSeleccionada ? fechaSeleccionada.toLocaleDateString('es-AR') : placeholder}`}
        aria-invalid={ariaInvalid || undefined}
        aria-describedby={ariaDescribedBy}
        onClick={abrir}
      >
        <span>{fechaSeleccionada ? fechaSeleccionada.toLocaleDateString('es-AR') : placeholder}</span>
        <CalendarBlank size={18} aria-hidden="true" />
      </button>
      {abierto && (
        <div className="calendar-picker__popover" role="dialog" aria-label="Elegir fecha">
          <div className="calendar-picker__header">
            <button
              type="button"
              aria-label="Mes anterior"
              onClick={() => setMesVisible(new Date(mesVisible.getFullYear(), mesVisible.getMonth() - 1, 1))}
            >
              <CaretLeft size={18} />
            </button>
            <strong>{nombresMeses.format(mesVisible)}</strong>
            <button
              type="button"
              aria-label="Mes siguiente"
              onClick={() => setMesVisible(new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 1))}
            >
              <CaretRight size={18} />
            </button>
          </div>
          <div className="calendar-picker__grid" role="grid" aria-label={nombresMeses.format(mesVisible)}>
            <div className="calendar-picker__row" role="row">
              {diasSemana.map((dia) => <span className="calendar-picker__weekday" role="columnheader" key={dia}>{dia}</span>)}
            </div>
            {semanas.map((semana, semanaIndex) => <div className="calendar-picker__row" role="row" key={semanaIndex}>
              {semana.map((dia, index) => {
                if (dia === null) return <span className="calendar-picker__empty" role="gridcell" aria-disabled="true" key={`empty-${index}`} />
                const fecha = new Date(mesVisible.getFullYear(), mesVisible.getMonth(), dia)
                const fechaIso = formatearFecha(fecha)
                const seleccionada = Boolean(fechaSeleccionada && fechaIso === value)
                const esHoy = fechaIso === formatearFecha(hoy)
                return (
                  <div className="calendar-picker__gridcell" role="gridcell" aria-selected={seleccionada} key={dia}>
                    <button
                      className={`calendar-picker__day${seleccionada ? ' is-selected' : ''}${esHoy ? ' is-today' : ''}`}
                      type="button"
                      data-calendar-date={fechaIso}
                      tabIndex={fechaEnFoco === fechaIso ? 0 : -1}
                      aria-label={fecha.toLocaleDateString('es-AR', { dateStyle: 'full' })}
                      aria-pressed={seleccionada}
                      onKeyDown={(event) => manejarTecladoFecha(event, fecha)}
                      onClick={() => {
                        onChange(fechaIso)
                        setAbierto(false)
                        disparador.current?.focus()
                      }}
                    >
                      {dia}
                    </button>
                  </div>
                )
              })}
            </div>)}
          </div>
        </div>
      )}
    </div>
  )
}
