import { CaretLeft, CaretRight, Plus, WarningCircle } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { AcademicSelect, type AcademicSelectOption } from '../../components/ui/AcademicSelect'
import { CalendarDatePicker } from '../../components/ui/CalendarDatePicker'
import { EmptyState } from '../../components/ui/EmptyState'
import { SurfaceSkeleton } from '../../components/ui/SurfaceSkeleton'
import { Toolbar } from '../../components/ui/Toolbar'
import { extraerMensajeError } from '../../services/api/erroresApi'
import { crearAsignacion, limpiarAgenda, listarAsignaciones, obtenerAgendaAsignatura } from '../../services/asignaciones/asignacionesSlice'
import { catalogosService, type AulaCatalogo } from '../../services/catalogos/catalogosService'
import type { Asignacion, Asignatura } from '../../types/api'

const asignacionVacia = { aulaId: '', asignaturaId: '', fecha: '', horaInicio: '', horaFin: '', cantidadEstudiantes: '' }
const dias = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

function fechaLocal(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

function desdeISO(valor: string): Date {
  return new Date(`${valor}T12:00:00`)
}

function agregarDias(valor: string, cantidad: number): string {
  const fecha = desdeISO(valor)
  fecha.setDate(fecha.getDate() + cantidad)
  return fechaLocal(fecha)
}

function inicioSemana(valor: string): string {
  const fecha = desdeISO(valor)
  return agregarDias(valor, -((fecha.getDay() + 6) % 7))
}

function mostrarFecha(valor: string): string {
  return desdeISO(valor).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function mostrarHora(valor: string): string {
  return valor.slice(0, 5)
}

function useCatalogoAsignaciones() {
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([])
  const [aulas, setAulas] = useState<AulaCatalogo[]>([])
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true)
  const [errorCatalogos, setErrorCatalogos] = useState('')

  useEffect(() => {
    let activo = true
    catalogosService.paraAsignaciones()
      .then((datos) => {
        if (!activo) return
        setAsignaturas(datos.asignaturas)
        setAulas(datos.aulas)
        setErrorCatalogos(datos.advertencias.join(' '))
      })
      .catch((error) => {
        if (activo) setErrorCatalogos(extraerMensajeError(error, 'No se pudieron cargar los catálogos'))
      })
      .finally(() => {
        if (activo) setCargandoCatalogos(false)
      })
    return () => { activo = false }
  }, [])

  return { asignaturas, aulas, cargandoCatalogos, errorCatalogos }
}

function opcionesAsignatura(asignaturas: Asignatura[]): AcademicSelectOption[] {
  return asignaturas.map((asignatura) => ({
    value: String(asignatura.id), label: asignatura.nombre, code: asignatura.codigo,
    description: `Año ${asignatura.anio} · ${asignatura.creditos} créditos`,
  }))
}

function opcionesAula(aulas: AulaCatalogo[]): AcademicSelectOption[] {
  return aulas.map((aula) => ({
    value: String(aula.id), label: aula.nombre || aula.codigo, code: aula.codigo,
    description: aula.sedeNombre, meta: `Capacidad: ${aula.capacidadMaxima}`,
  }))
}

export function AsignacionesPanel({ onNotify, query, setQuery }: { onNotify: (v: string) => void; query: string; setQuery: (v: string) => void }) {
  const dispatch = useAppDispatch()
  const { items, cargandoLista, errorLista, creando, errorCreacion } = useAppSelector((state) => state.asignaciones)
  const { asignaturas, aulas, cargandoCatalogos, errorCatalogos } = useCatalogoAsignaciones()
  const [valores, setValores] = useState(asignacionVacia)

  useEffect(() => { dispatch(listarAsignaciones()) }, [dispatch])

  const asignaturasPorId = new Map(asignaturas.map((item) => [item.id, item]))
  const aulasPorId = new Map(aulas.map((item) => [item.id, item]))
  const asignacionesVisibles = items.filter((item) => {
    const asignatura = asignaturasPorId.get(item.asignaturaId)
    const aula = aulasPorId.get(item.aulaId)
    const texto = `${asignatura?.nombre ?? ''} ${asignatura?.codigo ?? ''} ${aula?.nombre ?? ''} ${aula?.codigo ?? ''} ${item.fecha}`
    return texto.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es'))
  })

  const crear = async () => {
    const cantidadEstudiantes = Number(valores.cantidadEstudiantes)
    const aula = aulasPorId.get(Number(valores.aulaId))
    if (!aula || !asignaturasPorId.has(Number(valores.asignaturaId))) {
      onNotify('Seleccioná un aula y una asignatura válidas.')
      return
    }
    if (!Number.isInteger(cantidadEstudiantes) || cantidadEstudiantes < 1 || cantidadEstudiantes > aula.capacidadMaxima) {
      onNotify(`Ingresá entre 1 y ${aula.capacidadMaxima} estudiantes para esa aula.`)
      return
    }
    if (!valores.fecha || !valores.horaInicio || !valores.horaFin) {
      onNotify('Completá la fecha y las horas de inicio y de fin.')
      return
    }
    if (valores.horaInicio < '07:00' || valores.horaFin > '23:00') {
      onNotify('El horario debe estar entre las 07:00 y las 23:00.')
      return
    }
    if (valores.horaInicio >= valores.horaFin) {
      onNotify('La hora de fin debe ser posterior a la hora de inicio.')
      return
    }
    const resultado = await dispatch(crearAsignacion({
      aulaId: aula.id,
      asignaturaId: Number(valores.asignaturaId),
      fecha: valores.fecha,
      horaInicio: valores.horaInicio,
      horaFin: valores.horaFin,
      cantidadEstudiantes,
    }))
    if (crearAsignacion.fulfilled.match(resultado)) {
      onNotify('Asignación creada correctamente')
      setValores(asignacionVacia)
      dispatch(listarAsignaciones())
    }
  }

  return <>
    <article className="panel">
      <p className="muted-copy">Seleccioná el aula, la asignatura y el horario de la clase.</p>
      {cargandoCatalogos && <p className="muted-copy" role="status">Cargando aulas y asignaturas...</p>}
      {errorCatalogos && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {errorCatalogos}</div>}
      {errorCreacion && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {errorCreacion}</div>}
      <div className="form-grid assignment-form-grid">
        <AcademicSelect label="Aula" value={valores.aulaId} options={opcionesAula(aulas)} onChange={(aulaId) => setValores({ ...valores, aulaId })} placeholder="Seleccioná un aula" searchPlaceholder="Buscar aula por nombre o código..." emptyMessage="No hay aulas disponibles." loading={cargandoCatalogos} disabled={!cargandoCatalogos && aulas.length === 0} />
        <AcademicSelect label="Asignatura" value={valores.asignaturaId} options={opcionesAsignatura(asignaturas)} onChange={(asignaturaId) => setValores({ ...valores, asignaturaId })} placeholder="Seleccioná una asignatura" searchPlaceholder="Buscar asignatura por nombre o código..." emptyMessage="No hay asignaturas disponibles." loading={cargandoCatalogos} disabled={!cargandoCatalogos && asignaturas.length === 0} />
        <CalendarDatePicker label="Fecha" value={valores.fecha} onChange={(fecha) => setValores({ ...valores, fecha })} />
        <label>Cantidad de estudiantes
          <input type="number" inputMode="numeric" min="1" max={aulasPorId.get(Number(valores.aulaId))?.capacidadMaxima ?? 100} step="1" value={valores.cantidadEstudiantes} onChange={(e) => setValores({ ...valores, cantidadEstudiantes: e.target.value })} />
          <small>Según la capacidad del aula seleccionada.</small>
        </label>
        <label>Hora de inicio<input type="time" min="07:00" max="23:00" step="300" value={valores.horaInicio} onChange={(e) => setValores({ ...valores, horaInicio: e.target.value })} /></label>
        <label>Hora de fin<input type="time" min="07:00" max="23:00" step="300" value={valores.horaFin} onChange={(e) => setValores({ ...valores, horaFin: e.target.value })} /></label>
      </div>
      <button className="primary-button" type="button" onClick={crear} disabled={creando || cargandoCatalogos}><Plus size={16} /> {creando ? 'Guardando...' : 'Crear asignación'}</button>
    </article>

    <div className="section-title planning-section-divider"><span><h2>Asignaciones registradas</h2></span></div>
    <Toolbar query={query} setQuery={setQuery} placeholder="Buscar asignatura, aula o fecha..." filters={false} />
    <div className="list-meta"><span>{asignacionesVisibles.length} asignaciones</span><button className="text-button" type="button" onClick={() => dispatch(listarAsignaciones())} disabled={cargandoLista}>Actualizar</button></div>
    {errorLista && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {errorLista}</div>}
    {cargandoLista && items.length === 0 ? <SurfaceSkeleton label="asignaciones" rows={4} /> : (
      <div className="table-wrap assignment-list-table">
        <table>
          <thead><tr><th>Fecha</th><th>Asignatura</th><th>Aula</th><th>Horario</th><th>Estudiantes</th></tr></thead>
          <tbody>{asignacionesVisibles.map((item) => {
            const asignatura = asignaturasPorId.get(item.asignaturaId)
            const aula = aulasPorId.get(item.aulaId)
            return <tr key={item.id}>
              <td>{mostrarFecha(item.fecha)}</td>
              <td><strong>{asignatura?.nombre ?? `Asignatura #${item.asignaturaId}`}</strong><small>{asignatura?.codigo}</small></td>
              <td>{aula?.nombre ?? `Aula #${item.aulaId}`}<small>{aula?.sedeNombre}</small></td>
              <td>{mostrarHora(item.horaInicio)}–{mostrarHora(item.horaFin)}</td>
              <td>{item.cantidadEstudiantes}</td>
            </tr>
          })}</tbody>
        </table>
        {!cargandoLista && asignacionesVisibles.length === 0 && <EmptyState query={query} />}
      </div>
    )}
  </>
}

export function AgendaPanel() {
  const dispatch = useAppDispatch()
  const { agenda, cargandoAgenda, errorAgenda } = useAppSelector((state) => state.asignaciones)
  const { asignaturas, aulas, cargandoCatalogos, errorCatalogos } = useCatalogoAsignaciones()
  const [asignaturaId, setAsignaturaId] = useState('')
  const [fecha, setFecha] = useState(() => fechaLocal(new Date()))
  const semanaDesde = inicioSemana(fecha)
  const semanaHasta = agregarDias(semanaDesde, 6)

  useEffect(() => {
    if (!asignaturaId) {
      dispatch(limpiarAgenda())
      return
    }
    dispatch(obtenerAgendaAsignatura({ asignaturaId: Number(asignaturaId), desde: semanaDesde, hasta: semanaHasta }))
    return () => { dispatch(limpiarAgenda()) }
  }, [dispatch, asignaturaId, semanaDesde, semanaHasta])

  const aulasPorId = new Map(aulas.map((aula) => [aula.id, aula]))
  const diasSemana = dias.map((nombre, indice) => ({ nombre, fecha: agregarDias(semanaDesde, indice) }))
  const reservasPorDia = new Map<string, Asignacion[]>()
  for (const reserva of agenda) {
    const reservas = reservasPorDia.get(reserva.fecha) ?? []
    reservas.push(reserva)
    reservasPorDia.set(reserva.fecha, reservas)
  }

  return <article className="panel subject-agenda-panel">
    <p className="muted-copy">Elegí una asignatura para ver los horarios ocupados durante la semana.</p>
    <div className="form-grid agenda-filter-grid">
      <AcademicSelect label="Asignatura" value={asignaturaId} options={opcionesAsignatura(asignaturas)} onChange={setAsignaturaId} placeholder="Seleccioná una asignatura" searchPlaceholder="Buscar asignatura por nombre o código..." emptyMessage="No hay asignaturas disponibles." loading={cargandoCatalogos} disabled={!cargandoCatalogos && asignaturas.length === 0} />
      <CalendarDatePicker label="Ir a la semana de" value={fecha} onChange={setFecha} />
    </div>
    {errorCatalogos && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {errorCatalogos}</div>}
    <div className="subject-agenda-toolbar">
      <div className="subject-agenda-nav">
        <button className="calendar-nav" type="button" onClick={() => setFecha(agregarDias(semanaDesde, -7))} aria-label="Semana anterior"><CaretLeft size={17} /></button>
        <strong>{mostrarFecha(semanaDesde)} – {mostrarFecha(semanaHasta)}</strong>
        <button className="calendar-nav" type="button" onClick={() => setFecha(agregarDias(semanaDesde, 7))} aria-label="Semana siguiente"><CaretRight size={17} /></button>
        <button className="secondary-button" type="button" onClick={() => setFecha(fechaLocal(new Date()))}>Hoy</button>
      </div>
      {asignaturaId && !cargandoAgenda && !errorAgenda && <span className="subject-agenda-total" role="status">{agenda.length} {agenda.length === 1 ? 'horario ocupado' : 'horarios ocupados'}</span>}
    </div>
    {errorAgenda && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {errorAgenda}</div>}
    {cargandoAgenda ? <SurfaceSkeleton label="agenda de la asignatura" rows={3} /> : !asignaturaId ? (
      <p className="agenda-empty" role="status">Seleccioná una asignatura para consultar su agenda.</p>
    ) : !errorAgenda && (
      <div className="subject-agenda-grid" aria-label="Agenda semanal de la asignatura">
        {diasSemana.map((dia) => {
          const reservas = reservasPorDia.get(dia.fecha) ?? []
          return <section className="subject-agenda-day" key={dia.fecha} aria-label={`${dia.nombre} ${mostrarFecha(dia.fecha)}`}>
            <div className="subject-agenda-day-head"><strong>{dia.nombre}</strong><span>{mostrarFecha(dia.fecha)}</span></div>
            <small className="subject-agenda-count">{reservas.length} {reservas.length === 1 ? 'reserva' : 'reservas'}</small>
            {reservas.length === 0 ? <p className="subject-agenda-free">Sin horarios ocupados</p> : reservas.map((reserva) => {
              const aula = aulasPorId.get(reserva.aulaId)
              return <div className="subject-agenda-event" key={reserva.id}>
                <strong>{mostrarHora(reserva.horaInicio)}–{mostrarHora(reserva.horaFin)}</strong>
                <span>{aula?.nombre ?? `Aula #${reserva.aulaId}`}</span>
                <small>{aula?.sedeNombre ? `${aula.sedeNombre} · ` : ''}{reserva.cantidadEstudiantes} estudiantes</small>
              </div>
            })}
          </section>
        })}
      </div>
    )}
  </article>
}
