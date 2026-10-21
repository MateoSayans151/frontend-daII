import { Check, MapPin, Plus, WarningCircle } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { CalendarDatePicker } from '../../components/ui/CalendarDatePicker'
import { EmptyState } from '../../components/ui/EmptyState'
import { Toolbar } from '../../components/ui/Toolbar'
import { AcademicSelect, type AcademicSelectOption } from '../../components/ui/AcademicSelect'
import { SurfaceSkeleton } from '../../components/ui/SurfaceSkeleton'
import { crearSede, listarSedes } from '../../services/sedes/sedesSlice'
import { crearAula, listarAulas } from '../../services/aulas/aulasSlice'
import { crearAsignacion, obtenerAgenda } from '../../services/asignaciones/asignacionesSlice'
import { extraerMensajeError } from '../../services/api/erroresApi'
import { catalogosService, type AulaCatalogo } from '../../services/catalogos/catalogosService'
import { CursosPanel } from './CursosPanel'
import type { Asignatura } from '../../types/api'
import type { Screen } from '../../types/domain'
import './RealPlanningView.css'

export function RealPlanningView({ screen, query, setQuery, onNotify }: { screen: Screen; query: string; setQuery: (v: string) => void; onNotify: (v: string) => void }) {
  if (screen === 'Agenda') return <AgendaPanel onNotify={onNotify} />
  if (screen === 'Cursos') return <CursosPanel query={query} setQuery={setQuery} onNotify={onNotify} />
  if (screen === 'Asignaciones') return <AsignacionesPanel onNotify={onNotify} />
  return <SedesYAulasPanel query={query} setQuery={setQuery} onNotify={onNotify} />
}

function SedesYAulasPanel({ query, setQuery, onNotify }: { query: string; setQuery: (value: string) => void; onNotify: (v: string) => void }) {
  const dispatch = useAppDispatch()
  const sedes = useAppSelector((state) => state.sedes)
  const aulas = useAppSelector((state) => state.aulas)
  const [sedeId, setSedeId] = useState<number | null>(null)
  const [formSede, setFormSede] = useState(false)
  const [nuevaSede, setNuevaSede] = useState({ nombre: '', direccion: '' })
  const [formAula, setFormAula] = useState(false)
  const [nuevaAula, setNuevaAula] = useState({ codigo: '', nombre: '', capacidadMaxima: '' })

  useEffect(() => { dispatch(listarSedes()) }, [dispatch])
  useEffect(() => { if (sedeId) dispatch(listarAulas(sedeId)) }, [dispatch, sedeId])

  const sedesFiltradas = sedes.items.filter((s) => `${s.nombre} ${s.direccion}`.toLowerCase().includes(query.toLowerCase()))
  const aulasVisibles = aulas.items.filter((aula) => aula.sedeId === sedeId)

  const crearNuevaSede = async () => {
    const nombre = nuevaSede.nombre.trim()
    const direccion = nuevaSede.direccion.trim()
    if (!nombre || !direccion) {
      onNotify('Ingresá nombre y dirección para la sede.')
      return
    }
    const resultado = await dispatch(crearSede({ nombre, direccion }))
    if (crearSede.fulfilled.match(resultado)) {
      onNotify('Sede creada correctamente')
      setNuevaSede({ nombre: '', direccion: '' })
      setFormSede(false)
    }
  }

  const crearNuevaAula = async () => {
    if (!sedeId) return
    const capacidadMaxima = Number(nuevaAula.capacidadMaxima)
    if (!Number.isInteger(capacidadMaxima) || capacidadMaxima < 1 || capacidadMaxima > 100) {
      onNotify('Seleccioná una capacidad máxima entre 1 y 100.')
      return
    }
    const resultado = await dispatch(crearAula({ sedeId, datos: {
      codigo: nuevaAula.codigo.trim(), capacidadMaxima,
      nombre: nuevaAula.nombre.trim(),
    } }))
    if (crearAula.fulfilled.match(resultado)) {
      onNotify('Aula creada correctamente')
      setNuevaAula({ codigo: '', nombre: '', capacidadMaxima: '' })
      setFormAula(false)
    }
  }

  return <>
    <Toolbar query={query} setQuery={setQuery} placeholder="Buscar sedes por nombre o dirección..." filters={false} />
    <div className="section-title"><span><h2>Sedes</h2></span></div>
    <div className="list-meta"><span>{sedes.items.length} sedes</span><button className="text-button" onClick={() => setFormSede((v) => !v)}>{formSede ? 'Cancelar' : '+ Nueva sede'}</button></div>

    {sedes.cargando && sedes.items.length === 0 ? <SurfaceSkeleton label="sedes" variant="cards" rows={3} /> : (
      <div className="campus-grid">
        {sedesFiltradas.length === 0 ? <EmptyState query={query} /> : sedesFiltradas.map((sede) => {
          const seleccionado = sede.id === sedeId
          return <button
            key={sede.id}
            type="button"
            className={`campus-card${seleccionado ? ' is-selected' : ''}`}
            aria-pressed={seleccionado}
            onClick={() => setSedeId(sede.id)}
          >
            <strong>{sede.nombre}</strong>
            <span><MapPin size={15} aria-hidden="true" />{sede.direccion}</span>
          </button>
        })}
      </div>
    )}

    {sedeId !== null && sedes.items.find((sede) => sede.id === sedeId) && (
      <p className="muted-copy selected-campus-address"><MapPin size={16} aria-hidden="true" /> Dirección: {sedes.items.find((sede) => sede.id === sedeId)?.direccion}</p>
    )}
    {sedes.error && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {sedes.error}</div>}

    {formSede && (
      <article className="panel planning-form-panel">
        <div className="form-grid">
          <label>Nombre
            <input
              value={nuevaSede.nombre}
              onChange={(event) => setNuevaSede({ ...nuevaSede, nombre: event.target.value })}
              placeholder="Ej. Sede Córdoba"
            />
          </label>
          <label>Dirección
            <input
              value={nuevaSede.direccion}
              onChange={(event) => setNuevaSede({ ...nuevaSede, direccion: event.target.value })}
              placeholder="Ej. Av. San Martín 123, CABA"
            />
          </label>
        </div>
        <button className="primary-button" type="button" onClick={crearNuevaSede} disabled={sedes.cargando || !nuevaSede.nombre.trim() || !nuevaSede.direccion.trim()}><Check size={16} /> Guardar</button>
      </article>
    )}

    <div className="section-title planning-section-divider"><span><h2>Aulas</h2></span></div>
    {!sedeId
      ? <p className="muted-copy">Elegí una sede arriba para ver y crear sus aulas.</p>
      : <>
          {aulas.error && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {aulas.error}</div>}
          <div className="list-meta"><span>{aulasVisibles.length} aulas</span><button className="text-button" onClick={() => setFormAula((v) => !v)}>{formAula ? 'Cancelar' : '+ Nueva aula'}</button></div>
          {formAula && (
            <article className="panel planning-form-panel">
              <div className="form-grid">
                <label>Código<input required maxLength={80} value={nuevaAula.codigo} onChange={(e) => setNuevaAula({ ...nuevaAula, codigo: e.target.value })} placeholder="Ej. Aula 204" /></label>
                <label>Nombre (opcional)<input maxLength={255} value={nuevaAula.nombre} onChange={(e) => setNuevaAula({ ...nuevaAula, nombre: e.target.value })} placeholder="Ej. Aula de informática" /></label>
                <label>Capacidad máxima
                  <input type="number" inputMode="numeric" min="1" max="100" step="1" required value={nuevaAula.capacidadMaxima} onChange={(e) => setNuevaAula({ ...nuevaAula, capacidadMaxima: e.target.value })} />
                  <small>Entre 1 y 100 personas.</small>
                </label>
              </div>
              <button className="primary-button" type="button" onClick={crearNuevaAula} disabled={aulas.cargando || !nuevaAula.codigo.trim() || !nuevaAula.capacidadMaxima}><Check size={16} /> Guardar</button>
            </article>
          )}
          {aulas.cargando && aulasVisibles.length === 0 ? <SurfaceSkeleton label="aulas" /> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Código</th><th>Nombre</th><th>Capacidad</th></tr></thead>
                <tbody>{aulasVisibles.map((aula) => <tr key={aula.id}><td><strong>{aula.codigo}</strong></td><td>{aula.nombre}</td><td>{aula.capacidadMaxima} personas</td></tr>)}</tbody>
              </table>
              {!aulas.cargando && aulasVisibles.length === 0 && <EmptyState query="" />}
            </div>
          )}
        </>}
  </>
}

const asignacionVacia = { aulaId: '', asignaturaId: '', fecha: '', horaInicio: '', horaFin: '', cantidadEstudiantes: '' }

function AsignacionesPanel({ onNotify }: { onNotify: (v: string) => void }) {
  const dispatch = useAppDispatch()
  const { error, cargando } = useAppSelector((state) => state.asignaciones)
  const [valores, setValores] = useState(asignacionVacia)
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([])
  const [aulas, setAulas] = useState<AulaCatalogo[]>([])
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true)
  const [errorCatalogos, setErrorCatalogos] = useState('')

  useEffect(() => {
    let activo = true
    catalogosService.paraPlanificacion()
      .then((datos) => {
        if (!activo) return
        setAsignaturas(datos.asignaturas)
        setAulas(datos.aulas)
        setErrorCatalogos(datos.advertencias.join(' '))
      })
      .catch((catalogosError) => {
        if (activo) setErrorCatalogos(extraerMensajeError(catalogosError, 'No se pudieron cargar las asignaturas y aulas'))
      })
      .finally(() => {
        if (activo) setCargandoCatalogos(false)
      })
    return () => { activo = false }
  }, [])

  const opcionesAula: AcademicSelectOption[] = aulas.map((aula) => ({
    value: String(aula.id), label: aula.nombre || aula.codigo, code: aula.codigo,
    description: aula.sedeNombre, meta: `Capacidad: ${aula.capacidadMaxima}`,
  }))
  const opcionesAsignatura: AcademicSelectOption[] = asignaturas.map((asignatura) => ({
    value: String(asignatura.id), label: asignatura.nombre, code: asignatura.codigo,
    description: `Año ${asignatura.anio} · ${asignatura.creditos} créditos`,
  }))

  const crear = async () => {
    const ids = [valores.aulaId, valores.asignaturaId]
    const cantidadEstudiantes = Number(valores.cantidadEstudiantes)
    if (ids.some((valor) => !Number.isInteger(Number(valor)) || Number(valor) < 1)) {
      onNotify('Seleccioná un aula y una asignatura válidas.')
      return
    }
    if (!Number.isInteger(cantidadEstudiantes) || cantidadEstudiantes < 1 || cantidadEstudiantes > 100) {
      onNotify('Ingresá una cantidad de estudiantes entre 1 y 100.')
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
      aulaId: Number(valores.aulaId),
      asignaturaId: Number(valores.asignaturaId),
      fecha: valores.fecha,
      horaInicio: valores.horaInicio,
      horaFin: valores.horaFin,
      cantidadEstudiantes: Number(valores.cantidadEstudiantes),
    }))
    if (crearAsignacion.fulfilled.match(resultado)) {
      onNotify('Asignación creada correctamente')
      setValores(asignacionVacia)
    }
  }

  return <article className="panel">
    <p className="muted-copy">Seleccioná el aula, la asignatura y el horario de la clase.</p>
    {cargandoCatalogos && <p className="muted-copy" role="status">Cargando aulas y asignaturas...</p>}
    {errorCatalogos && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {errorCatalogos}</div>}
    {error && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {error}</div>}
    <div className="form-grid assignment-form-grid">
      <AcademicSelect label="Aula" value={valores.aulaId} options={opcionesAula} onChange={(aulaId) => setValores({ ...valores, aulaId })} placeholder="Seleccioná un aula" searchPlaceholder="Buscar aula por nombre o código..." emptyMessage="No hay aulas disponibles." loading={cargandoCatalogos} disabled={!cargandoCatalogos && opcionesAula.length === 0} />
      <AcademicSelect label="Asignatura" value={valores.asignaturaId} options={opcionesAsignatura} onChange={(asignaturaId) => setValores({ ...valores, asignaturaId })} placeholder="Seleccioná una asignatura" searchPlaceholder="Buscar asignatura por nombre o código..." emptyMessage="No hay asignaturas disponibles." loading={cargandoCatalogos} disabled={!cargandoCatalogos && opcionesAsignatura.length === 0} />
      <CalendarDatePicker label="Fecha" value={valores.fecha} onChange={(fecha) => setValores({ ...valores, fecha })} />
      <label>Cantidad de estudiantes
        <input type="number" inputMode="numeric" min="1" max="100" step="1" value={valores.cantidadEstudiantes} onChange={(e) => setValores({ ...valores, cantidadEstudiantes: e.target.value })} />
        <small>La capacidad máxima es 100.</small>
      </label>
      <label>Hora de inicio<input type="time" min="07:00" max="23:00" step="300" value={valores.horaInicio} onChange={(e) => setValores({ ...valores, horaInicio: e.target.value })} /></label>
      <label>Hora de fin<input type="time" min="07:00" max="23:00" step="300" value={valores.horaFin} onChange={(e) => setValores({ ...valores, horaFin: e.target.value })} /></label>
    </div>
    <button className="primary-button" type="button" onClick={crear} disabled={cargando || cargandoCatalogos}><Plus size={16} /> {cargando ? 'Guardando...' : 'Crear asignación'}</button>
  </article>
}

function AgendaPanel({ onNotify }: { onNotify: (v: string) => void }) {
  const dispatch = useAppDispatch()
  const { agenda, cargando, error } = useAppSelector((state) => state.asignaciones)
  const [aulaId, setAulaId] = useState('')
  const [fecha, setFecha] = useState('')
  const [aulas, setAulas] = useState<AulaCatalogo[]>([])
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([])
  const [consultada, setConsultada] = useState(false)
  const [cargandoAulas, setCargandoAulas] = useState(true)
  const [errorAulas, setErrorAulas] = useState('')

  useEffect(() => {
    let activo = true
    catalogosService.paraPlanificacion()
      .then((datos) => {
        if (!activo) return
        setAulas(datos.aulas)
        setAsignaturas(datos.asignaturas)
        setErrorAulas(datos.advertencias.join(' '))
      })
      .catch((catalogosError) => {
        if (activo) setErrorAulas(extraerMensajeError(catalogosError, 'No se pudieron cargar las aulas'))
      })
      .finally(() => {
        if (activo) setCargandoAulas(false)
      })
    return () => { activo = false }
  }, [])

  const opcionesAula: AcademicSelectOption[] = aulas.map((aula) => ({
    value: String(aula.id), label: aula.nombre || aula.codigo, code: aula.codigo,
    description: aula.sedeNombre, meta: `Capacidad: ${aula.capacidadMaxima}`,
  }))

  const consultar = async () => {
    if (!aulaId || !fecha) {
      onNotify('Completá el aula y la fecha.')
      return
    }
    const resultado = await dispatch(obtenerAgenda({ aulaId: Number(aulaId), fecha }))
    if (obtenerAgenda.fulfilled.match(resultado)) setConsultada(true)
  }

  return <article className="panel">
    <div className="form-grid agenda-filter-grid">
      <AcademicSelect label="Aula" value={aulaId} options={opcionesAula} onChange={(value) => { setAulaId(value); setConsultada(false) }} placeholder="Seleccioná un aula" searchPlaceholder="Buscar aula por nombre o código..." emptyMessage="No hay aulas disponibles." loading={cargandoAulas} disabled={!cargandoAulas && opcionesAula.length === 0} />
      <CalendarDatePicker label="Fecha" value={fecha} onChange={(value) => { setFecha(value); setConsultada(false) }} />
    </div>
    {errorAulas && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {errorAulas}</div>}
    <button className="secondary-button" type="button" onClick={consultar} disabled={cargando || cargandoAulas}>{cargando ? 'Consultando...' : 'Consultar agenda'}</button>
    {error && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {error}</div>}
    {cargando ? <SurfaceSkeleton label="agenda del aula" rows={3} /> : consultada && agenda.length > 0 ? (
      <div className="table-wrap agenda-results">
        <table>
          <thead><tr><th>Asignatura</th><th>Horario</th><th>Estudiantes</th></tr></thead>
          <tbody>{agenda.map((a) => {
            const asignatura = asignaturas.find((item) => item.id === a.asignaturaId)
            return <tr key={a.id}><td><strong>{asignatura?.nombre ?? 'Asignatura sin catálogo'}</strong>{asignatura && <div className="muted-copy">{asignatura.codigo}</div>}</td><td>{a.horaInicio} – {a.horaFin}</td><td>{a.cantidadEstudiantes}</td></tr>
          })}</tbody>
        </table>
      </div>
    ) : consultada ? <p className="agenda-empty" role="status">No hay asignaciones para esa aula y fecha.</p> : <p className="muted-copy agenda-guidance">Elegí un aula y una fecha para consultar su ocupación.</p>}
  </article>
}
