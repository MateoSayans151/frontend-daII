import { CalendarBlank, Check, WarningCircle } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import './RealCycleView.css'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { CalendarDatePicker } from '../../components/ui/CalendarDatePicker'
import { EmptyState } from '../../components/ui/EmptyState'
import { SurfaceSkeleton } from '../../components/ui/SurfaceSkeleton'
import { Toolbar } from '../../components/ui/Toolbar'
import { crearPeriodo, listarPeriodos } from '../../services/periodos/periodosSlice'
import { crearTurnoExamen, listarTurnosExamen } from '../../services/turnosExamen/turnosExamenSlice'
import type { Screen } from '../../types/domain'

export function RealCycleView({ screen, query, setQuery, onNotify }: { screen: Screen; query: string; setQuery: (v: string) => void; onNotify: (v: string) => void }) {
  const periodos = screen === 'Períodos'
  return <>
    <Toolbar query={query} setQuery={setQuery} placeholder={periodos ? 'Buscar período por año...' : 'Buscar turno por nombre...'} filters={false} />
    {periodos ? <PeriodosPanel query={query} onNotify={onNotify} /> : <TurnosPanel query={query} onNotify={onNotify} />}
  </>
}

const periodoVacio = {
  anio: '',
  numero: '1',
  fechaInicio: '',
  fechaFin: '',
  inscripcionDesde: '',
  inscripcionHasta: '',
}
const opcionesAnio = Array.from({ length: 2100 - 2026 + 1 }, (_, index) => 2026 + index)
const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function esFechaValida(fecha: string) {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha)
  if (!coincidencia) return false

  const [, anio, mes, dia] = coincidencia.map(Number)
  const fechaUtc = new Date(Date.UTC(anio, mes - 1, dia))

  return fechaUtc.getUTCFullYear() === anio
    && fechaUtc.getUTCMonth() === mes - 1
    && fechaUtc.getUTCDate() === dia
}

function fechaLegible(fecha: string) {
  const [anio, mes, dia] = fecha.slice(0, 10).split('-').map(Number)
  const fechaUtc = new Date(Date.UTC(anio, mes - 1, dia))

  if (!anio || !mes || !dia || Number.isNaN(fechaUtc.getTime())) return fecha

  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(fechaUtc)
}

function PeriodosPanel({ query, onNotify }: { query: string; onNotify: (v: string) => void }) {
  const dispatch = useAppDispatch()
  const { items, cargando, error } = useAppSelector((state) => state.periodos)
  const [formAbierto, setFormAbierto] = useState(false)
  const [valores, setValores] = useState(periodoVacio)

  useEffect(() => { dispatch(listarPeriodos()) }, [dispatch])

  const rows = items.filter((p) => `${p.anio} ${p.numero}`.includes(query))

  const crear = async () => {
    if (!valores.anio || !esFechaValida(valores.fechaInicio) || !esFechaValida(valores.fechaFin)) {
      onNotify('Completá el año e ingresá fechas válidas para el período.')
      return
    }
    if (valores.fechaFin <= valores.fechaInicio) {
      onNotify('La fecha de fin debe ser posterior a la fecha de inicio.')
      return
    }
    if (!esFechaValida(valores.inscripcionDesde) || !esFechaValida(valores.inscripcionHasta)) {
      onNotify('Ingresá fechas válidas para la inscripción.')
      return
    }
    if (valores.inscripcionHasta <= valores.inscripcionDesde) {
      onNotify('La inscripción debe finalizar en una fecha posterior a su inicio.')
      return
    }
    if (valores.inscripcionHasta > valores.fechaInicio) {
      onNotify('La inscripción debe cerrar antes o el mismo día del inicio del período.')
      return
    }
    const resultado = await dispatch(crearPeriodo({
      anio: Number(valores.anio),
      numero: Number(valores.numero),
      fechaInicio: valores.fechaInicio,
      fechaFin: valores.fechaFin,
      inscripcionDesde: valores.inscripcionDesde,
      inscripcionHasta: valores.inscripcionHasta,
    }))
    if (crearPeriodo.fulfilled.match(resultado)) {
      onNotify('Período creado correctamente')
      setValores(periodoVacio)
      setFormAbierto(false)
    }
  }

  return <>
    <div className="list-meta"><span>{rows.length} períodos</span><button className="text-button" onClick={() => setFormAbierto((v) => !v)}>{formAbierto ? 'Cancelar' : '+ Crear período'}</button></div>
    {error && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {error}</div>}
    {formAbierto && (
      <article className="panel create-form-panel">
        <div className="form-grid">
          <label>Año
            <select value={valores.anio} onChange={(e) => setValores({ ...valores, anio: e.target.value })}>
              <option value="">Seleccioná el año</option>
              {opcionesAnio.map((anio) => <option key={anio} value={anio}>{anio}</option>)}
            </select>
          </label>
          <label>Número de cuatrimestre
            <select value={valores.numero} onChange={(e) => setValores({ ...valores, numero: e.target.value })}>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </label>
          <CalendarDatePicker label="Fecha de inicio" value={valores.fechaInicio} onChange={(fechaInicio) => setValores({ ...valores, fechaInicio })} />
          <CalendarDatePicker label="Fecha de fin" value={valores.fechaFin} onChange={(fechaFin) => setValores({ ...valores, fechaFin })} />
          <CalendarDatePicker label="Inscripción desde" value={valores.inscripcionDesde} onChange={(inscripcionDesde) => setValores({ ...valores, inscripcionDesde })} />
          <CalendarDatePicker label="Inscripción hasta" value={valores.inscripcionHasta} onChange={(inscripcionHasta) => setValores({ ...valores, inscripcionHasta })} />
        </div>
        <button className="primary-button" onClick={crear}><Check size={16} /> Guardar</button>
      </article>
    )}
    {cargando && rows.length === 0 ? <SurfaceSkeleton label="períodos" variant="cards" rows={3} /> : rows.length === 0 ? <EmptyState query={query} /> : (
      <div className="cycle-cards">
        {rows.map((periodo) => (
          <article className="cycle-card" key={periodo.id}>
            <h2>{periodo.numero}.º cuatrimestre {periodo.anio}</h2>
            <div className="cycle-date-group">
              <span>Período académico</span>
              <p><CalendarBlank size={16} /> {fechaLegible(periodo.fechaInicio)} – {fechaLegible(periodo.fechaFin)}</p>
            </div>
            <div className="cycle-date-group">
              <span>Inscripción a materias</span>
              <p><CalendarBlank size={16} /> {fechaLegible(periodo.inscripcionDesde)} – {fechaLegible(periodo.inscripcionHasta)}</p>
            </div>
          </article>
        ))}
      </div>
    )}
  </>
}

const turnoVacio = { mes: '', anio: '', fechaInicio: '', fechaFin: '', inscripcionDesde: '', inscripcionHasta: '' }

function TurnosPanel({ query, onNotify }: { query: string; onNotify: (v: string) => void }) {
  const dispatch = useAppDispatch()
  const { items, cargando, error } = useAppSelector((state) => state.turnosExamen)
  const [formAbierto, setFormAbierto] = useState(false)
  const [valores, setValores] = useState(turnoVacio)

  useEffect(() => { dispatch(listarTurnosExamen()) }, [dispatch])

  const rows = items.filter((t) => t.nombre.toLowerCase().includes(query.toLowerCase()))

  const crear = async () => {
    if (!valores.mes || !valores.anio) {
      onNotify('Seleccioná el mes y el año del turno.')
      return
    }
    if (!esFechaValida(valores.fechaInicio) || !esFechaValida(valores.fechaFin)) {
      onNotify('Ingresá fechas válidas para el turno de examen.')
      return
    }
    if (valores.fechaFin <= valores.fechaInicio) {
      onNotify('La fecha de fin del turno debe ser posterior a la de inicio.')
      return
    }
    if (!esFechaValida(valores.inscripcionDesde) || !esFechaValida(valores.inscripcionHasta)) {
      onNotify('Ingresá fechas válidas para la inscripción al examen.')
      return
    }
    if (valores.inscripcionHasta <= valores.inscripcionDesde) {
      onNotify('La inscripción debe finalizar en una fecha posterior a su inicio.')
      return
    }
    if (valores.inscripcionHasta > valores.fechaInicio) {
      onNotify('La inscripción debe cerrar antes del inicio del turno.')
      return
    }

    const { mes, anio, ...datosTurno } = valores
    const resultado = await dispatch(crearTurnoExamen({
      ...datosTurno,
      nombre: `Turno ${mes} ${anio}`,
    }))
    if (crearTurnoExamen.fulfilled.match(resultado)) {
      onNotify('Turno de examen creado correctamente')
      setValores(turnoVacio)
      setFormAbierto(false)
    }
  }

  return <>
    <div className="list-meta"><span>{rows.length} turnos</span><button className="text-button" onClick={() => setFormAbierto((v) => !v)}>{formAbierto ? 'Cancelar' : '+ Crear turno'}</button></div>
    {error && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {error}</div>}
    {formAbierto && (
      <article className="panel create-form-panel">
        <div className="form-grid">
          <label>Mes
            <select value={valores.mes} onChange={(e) => setValores({ ...valores, mes: e.target.value })}>
              <option value="">Seleccioná el mes</option>
              {meses.map((mes) => <option key={mes} value={mes}>{mes}</option>)}
            </select>
          </label>
          <label>Año
            <select value={valores.anio} onChange={(e) => setValores({ ...valores, anio: e.target.value })}>
              <option value="">Seleccioná el año</option>
              {opcionesAnio.map((anio) => <option key={anio} value={anio}>{anio}</option>)}
            </select>
          </label>
          <CalendarDatePicker label="Fecha de inicio" value={valores.fechaInicio} onChange={(fechaInicio) => setValores({ ...valores, fechaInicio })} />
          <CalendarDatePicker label="Fecha de fin" value={valores.fechaFin} onChange={(fechaFin) => setValores({ ...valores, fechaFin })} />
          <CalendarDatePicker label="Inscripción desde" value={valores.inscripcionDesde} onChange={(inscripcionDesde) => setValores({ ...valores, inscripcionDesde })} />
          <CalendarDatePicker label="Inscripción hasta" value={valores.inscripcionHasta} onChange={(inscripcionHasta) => setValores({ ...valores, inscripcionHasta })} />
        </div>
        <button className="primary-button" onClick={crear}><Check size={16} /> Guardar</button>
      </article>
    )}
    {cargando && rows.length === 0 ? <SurfaceSkeleton label="turnos de examen" variant="cards" rows={3} /> : rows.length === 0 ? <EmptyState query={query} /> : (
      <div className="cycle-cards">
        {rows.map((turno) => (
          <article className="cycle-card" key={turno.id}>
            <h2>{turno.nombre}</h2>
            <div className="cycle-date-group">
              <span>Turno de examen</span>
              <p><CalendarBlank size={16} /> {fechaLegible(turno.fechaInicio)} – {fechaLegible(turno.fechaFin)}</p>
            </div>
            <div className="cycle-date-group">
              <span>Inscripción a examen</span>
              <p><CalendarBlank size={16} /> {fechaLegible(turno.inscripcionDesde)} – {fechaLegible(turno.inscripcionHasta)}</p>
            </div>
          </article>
        ))}
      </div>
    )}
  </>
}
