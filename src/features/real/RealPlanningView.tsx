import { Check, MapPin, Plus, WarningCircle } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { CalendarDatePicker } from '../../components/ui/CalendarDatePicker'
import { EmptyState } from '../../components/ui/EmptyState'
import { crearSede, listarSedes } from '../../services/sedes/sedesSlice'
import { crearAula, listarAulas } from '../../services/aulas/aulasSlice'
import { crearAsignacion, obtenerAgenda } from '../../services/asignaciones/asignacionesSlice'
import { extraerMensajeError } from '../../services/api/erroresApi'
import { catalogosService, type AulaCatalogo } from '../../services/catalogos/catalogosService'
import { CursosPanel } from './CursosPanel'
import type { Asignatura } from '../../types/api'
import type { Screen } from '../../types/domain'
import './RealPlanningView.css'

const opcionesCapacidadAula = Array.from({ length: 100 }, (_, index) => index + 1)
const opcionesAsignacion = Array.from({ length: 100 }, (_, index) => index + 1)
const horasDisponibles = Array.from({ length: 17 }, (_, index) => index + 7)
const minutosDisponibles = Array.from({ length: 12 }, (_, index) => index * 5)

function SelectorHora({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [abierto, setAbierto] = useState(false)
  const [paso, setPaso] = useState<'hora' | 'minutos'>('hora')
  const [horaTemporal, setHoraTemporal] = useState(7)
  const [minutosTemporales, setMinutosTemporales] = useState(0)
  const contenedor = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return
    const cerrarAlHacerClickAfuera = (event: MouseEvent) => {
      if (!contenedor.current?.contains(event.target as Node)) setAbierto(false)
    }
    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', cerrarAlHacerClickAfuera)
    document.addEventListener('keydown', cerrarConEscape)
    return () => {
      document.removeEventListener('mousedown', cerrarAlHacerClickAfuera)
      document.removeEventListener('keydown', cerrarConEscape)
    }
  }, [abierto])

  const abrir = () => {
    const [hora, minutos] = value ? value.split(':').map(Number) : [7, 0]
    setHoraTemporal(hora)
    setMinutosTemporales(minutos)
    setPaso('hora')
    setAbierto((actual) => !actual)
  }

  const seleccionarHora = (hora: number) => {
    setHoraTemporal(hora)
    if (hora === 23) setMinutosTemporales(0)
    setPaso('minutos')
  }

  const seleccionarMinutos = (minutos: number) => {
    setMinutosTemporales(minutos)
    setPaso('minutos')
  }

  const anguloSeleccionado = (paso === 'hora' ? (horaTemporal % 12) * 30 : minutosTemporales * 6) - 90
  const radioSeleccionado = paso === 'hora' && horaTemporal > 12 ? 65 : 103
  const xManecilla = 130 + radioSeleccionado * Math.cos((anguloSeleccionado * Math.PI) / 180)
  const yManecilla = 130 + radioSeleccionado * Math.sin((anguloSeleccionado * Math.PI) / 180)
  const horaFormateada = String(horaTemporal).padStart(2, '0')
  const minutosFormateados = String(minutosTemporales).padStart(2, '0')

  const posicionOpcion = (indice: number, total: number, radio: number) => {
    const angulo = (indice * (360 / total) - 90) * Math.PI / 180
    return { left: 130 + radio * Math.cos(angulo), top: 130 + radio * Math.sin(angulo) }
  }

  const confirmar = () => {
    onChange(`${horaFormateada}:${minutosFormateados}`)
    setAbierto(false)
  }

  return (
    <div ref={contenedor} style={{ position: 'relative' }}>
      <label>
        {label}
        <button
          className="assignment-time-trigger"
          type="button"
          aria-haspopup="dialog"
          aria-expanded={abierto}
          onClick={abrir}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 12px',
            color: value ? 'inherit' : '#7a8497',
            background: '#fff',
            border: '1px solid #cbd2df',
            borderRadius: 8,
            textAlign: 'left',
          }}
        >
          {value || 'Seleccioná una hora...'} <span aria-hidden="true">▾</span>
        </button>
      </label>
      {abierto && (
        <div
          role="dialog"
          aria-label={`Elegir ${label.toLowerCase()}`}
          style={{
            position: 'absolute',
            zIndex: 20,
            top: '100%',
            left: 0,
            width: 'min(320px, calc(100vw - 40px))',
            padding: 18,
            background: '#fff',
            border: '1px solid #d8deea',
            borderRadius: 14,
            boxShadow: '0 12px 32px rgba(27, 43, 73, 0.22)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setPaso('hora')}
              aria-pressed={paso === 'hora'}
              style={{ border: 0, borderRadius: 8, padding: '6px 10px', background: paso === 'hora' ? '#e8edff' : 'transparent', color: '#283c82', fontSize: 32, fontWeight: 600 }}
            >
              {horaFormateada}
            </button>
            <span style={{ alignSelf: 'center', fontSize: 30, color: '#667085' }}>:</span>
            <button
              type="button"
              onClick={() => setPaso('minutos')}
              aria-pressed={paso === 'minutos'}
              style={{ border: 0, borderRadius: 8, padding: '6px 10px', background: paso === 'minutos' ? '#e8edff' : 'transparent', color: '#283c82', fontSize: 32, fontWeight: 600 }}
            >
              {minutosFormateados}
            </button>
          </div>
          <div aria-label={paso === 'hora' ? 'Elegí una hora' : 'Elegí los minutos'} style={{ position: 'relative', width: 260, height: 260, maxWidth: '100%', margin: '0 auto', borderRadius: '50%', background: '#f0f2f8' }}>
            <svg aria-hidden="true" viewBox="0 0 260 260" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
              <line x1="130" y1="130" x2={xManecilla} y2={yManecilla} stroke="#4459a8" strokeWidth="2" />
              <circle cx={xManecilla} cy={yManecilla} r="16" fill="#4459a8" />
              <circle cx="130" cy="130" r="4" fill="#4459a8" />
            </svg>
            {paso === 'hora'
              ? horasDisponibles.map((hora) => {
                const posicion = posicionOpcion(hora % 12, 12, hora > 12 ? 65 : 103)
                const seleccionada = hora === horaTemporal
                return (
                  <button
                    key={hora}
                    type="button"
                    aria-label={`${hora} horas`}
                    aria-pressed={seleccionada}
                    onClick={() => seleccionarHora(hora)}
                    style={{ position: 'absolute', ...posicion, transform: 'translate(-50%, -50%)', zIndex: 1, width: 34, height: 34, padding: 0, border: 0, borderRadius: '50%', background: seleccionada ? '#4459a8' : 'transparent', color: seleccionada ? '#fff' : '#26314b', fontSize: 14, fontWeight: seleccionada ? 700 : 500 }}
                  >
                    {hora}
                  </button>
                )
              })
              : minutosDisponibles.map((minutos, indice) => {
                const posicion = posicionOpcion(indice, 12, 103)
                const seleccionada = minutos === minutosTemporales
                const deshabilitado = horaTemporal === 23 && minutos !== 0
                return (
                  <button
                    key={minutos}
                    type="button"
                    aria-label={`${minutos} minutos`}
                    aria-pressed={seleccionada}
                    disabled={deshabilitado}
                    onClick={() => seleccionarMinutos(minutos)}
                    style={{ position: 'absolute', ...posicion, transform: 'translate(-50%, -50%)', zIndex: 1, width: 38, height: 38, padding: 0, border: 0, borderRadius: '50%', background: seleccionada ? '#4459a8' : 'transparent', color: seleccionada ? '#fff' : deshabilitado ? '#b9bfcc' : '#26314b', fontSize: 13, fontWeight: seleccionada ? 700 : 500, cursor: deshabilitado ? 'default' : 'pointer' }}
                  >
                    {String(minutos).padStart(2, '0')}
                  </button>
                )
              })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 16 }}>
            <button type="button" className="text-button" onClick={() => setAbierto(false)}>Cancelar</button>
            <button type="button" className="text-button" onClick={confirmar}>Aceptar</button>
          </div>
        </div>
      )}
    </div>
  )
}

export function RealPlanningView({ screen, query, onNotify }: { screen: Screen; query: string; setQuery: (v: string) => void; onNotify: (v: string) => void }) {
  if (screen === 'Agenda') return <AgendaPanel onNotify={onNotify} />
  if (screen === 'Cursos') return <CursosPanel query={query} onNotify={onNotify} />
  if (screen === 'Asignaciones') return <AsignacionesPanel onNotify={onNotify} />
  return <SedesYAulasPanel query={query} onNotify={onNotify} />
}

function SedesYAulasPanel({ query, onNotify }: { query: string; onNotify: (v: string) => void }) {
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
    <div className="section-title"><span><h2>Sedes</h2></span></div>
    <div className="list-meta"><span>{sedes.items.length} sedes</span><button className="text-button" onClick={() => setFormSede((v) => !v)}>{formSede ? 'Cancelar' : '+ Nueva sede'}</button></div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
      {sedesFiltradas.length === 0 ? (
        <EmptyState query={query} />
      ) : (
        sedesFiltradas.map((sede) => {
          const seleccionado = sede.id === sedeId
          return (
            <button
              key={sede.id}
              type="button"
              aria-pressed={seleccionado}
              onClick={() => setSedeId(sede.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 8,
                textAlign: 'left',
                padding: '16px 18px',
                borderRadius: 12,
                border: `1px solid ${seleccionado ? '#4459a8' : '#d8deea'}`,
                background: seleccionado ? '#eef2ff' : '#fff',
                color: '#1b2b49',
                boxShadow: seleccionado ? '0 4px 12px rgba(68, 89, 168, 0.12)' : '0 1px 2px rgba(27, 43, 73, 0.04)',
                cursor: 'pointer',
              }}
            >
              <strong style={{ fontSize: 15 }}>{sede.nombre}</strong>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4d5d7a', fontSize: 13 }}>
                <MapPin size={14} />
                {sede.direccion}
              </span>
            </button>
          )
        })
      )}
    </div>

    {sedeId !== null && sedes.items.find((sede) => sede.id === sedeId) && (
      <p className="muted-copy" style={{ marginTop: 12 }}><MapPin size={16} /> Dirección: {sedes.items.find((sede) => sede.id === sedeId)?.direccion}</p>
    )}
    {sedes.error && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {sedes.error}</div>}

    {formSede && (
      <article className="panel" style={{ marginBottom: 18 }}>
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
        <button className="primary-button" onClick={crearNuevaSede}><Check size={16} /> Guardar</button>
      </article>
    )}

    <div className="section-title" style={{ marginTop: 28 }}><span><h2>Aulas</h2></span></div>
    {!sedeId
      ? <p className="muted-copy">Elegí una sede arriba para ver y crear sus aulas.</p>
      : <>
          {aulas.error && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {aulas.error}</div>}
          <div className="list-meta"><span>{aulas.items.length} aulas</span><button className="text-button" onClick={() => setFormAula((v) => !v)}>{formAula ? 'Cancelar' : '+ Nueva aula'}</button></div>
          {formAula && (
            <article className="panel" style={{ marginBottom: 18 }}>
              <div className="form-grid">
                <label>Código<input value={nuevaAula.codigo} onChange={(e) => setNuevaAula({ ...nuevaAula, codigo: e.target.value })} placeholder="Ej. Aula 204" /></label>
                <label>Nombre (opcional)<input maxLength={255} value={nuevaAula.nombre} onChange={(e) => setNuevaAula({ ...nuevaAula, nombre: e.target.value })} placeholder="Ej. Aula de informática" /></label>
                <label>Capacidad máxima
                  <select value={nuevaAula.capacidadMaxima} onChange={(e) => setNuevaAula({ ...nuevaAula, capacidadMaxima: e.target.value })}>
                    <option value="">Seleccioná una capacidad...</option>
                    {opcionesCapacidadAula.map((capacidad) => <option key={capacidad} value={capacidad}>{capacidad}</option>)}
                  </select>
                </label>
              </div>
              <button className="primary-button" onClick={crearNuevaAula}><Check size={16} /> Guardar</button>
            </article>
          )}
          <div className="table-wrap">
            <table>
              <thead><tr><th>Código</th><th>Nombre</th><th>Capacidad</th><th>ID (para asignar)</th></tr></thead>
              <tbody>{aulas.items.map((aula) => <tr key={aula.id}><td><strong>{aula.codigo}</strong></td><td>{aula.nombre}</td><td>{aula.capacidadMaxima} personas</td><td><span className="code">#{aula.id}</span></td></tr>)}</tbody>
            </table>
            {!aulas.cargando && aulas.items.length === 0 && <EmptyState query="" />}
          </div>
        </>}
  </>
}

const asignacionVacia = { aulaId: '', asignaturaId: '', fecha: '', horaInicio: '', horaFin: '', cantidadEstudiantes: '' }

function AsignacionesPanel({ onNotify }: { onNotify: (v: string) => void }) {
  const dispatch = useAppDispatch()
  const { error } = useAppSelector((state) => state.asignaciones)
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
      })
      .catch((catalogosError) => {
        if (activo) setErrorCatalogos(extraerMensajeError(catalogosError, 'No se pudieron cargar las asignaturas y aulas'))
      })
      .finally(() => {
        if (activo) setCargandoCatalogos(false)
      })
    return () => { activo = false }
  }, [])

  const crear = async () => {
    const ids = [valores.aulaId, valores.asignaturaId]
    const cantidadEstudiantes = Number(valores.cantidadEstudiantes)
    if (ids.some((valor) => !Number.isInteger(Number(valor)) || Number(valor) < 1)) {
      onNotify('Seleccioná un aula y una asignatura válidas.')
      return
    }
    if (!Number.isInteger(cantidadEstudiantes) || cantidadEstudiantes < 1 || cantidadEstudiantes > 100) {
      onNotify('Seleccioná una cantidad de estudiantes entre 1 y 100.')
      return
    }
    if (!valores.horaInicio || !valores.horaFin) {
      onNotify('Seleccioná la hora de inicio y de fin.')
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
    <p className="muted-copy">Elegí el aula y la asignatura por su código y nombre; el sistema enviará sus IDs al backend.</p>
    {cargandoCatalogos && <p className="muted-copy">Cargando aulas y asignaturas...</p>}
    {errorCatalogos && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {errorCatalogos}</div>}
    {error && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {error}</div>}
    <div className="form-grid assignment-form-grid">
      <label>Aula
        <select value={valores.aulaId} onChange={(e) => setValores({ ...valores, aulaId: e.target.value })}>
          <option value="">Seleccioná un aula...</option>
          {aulas.map((aula) => <option key={aula.id} value={aula.id}>{aula.codigo} - {aula.nombre} ({aula.sedeNombre})</option>)}
        </select>
      </label>
      <label>Asignatura
        <select value={valores.asignaturaId} onChange={(e) => setValores({ ...valores, asignaturaId: e.target.value })}>
          <option value="">Seleccioná una asignatura...</option>
          {asignaturas.map((asignatura) => <option key={asignatura.id} value={asignatura.id}>{asignatura.codigo} - {asignatura.nombre}</option>)}
        </select>
      </label>
      <CalendarDatePicker label="Fecha" value={valores.fecha} onChange={(fecha) => setValores({ ...valores, fecha })} />
      <label>Cantidad de estudiantes
        <select value={valores.cantidadEstudiantes} onChange={(e) => setValores({ ...valores, cantidadEstudiantes: e.target.value })}>
          <option value="">Seleccioná una cantidad...</option>
          {opcionesAsignacion.map((cantidad) => <option key={cantidad} value={cantidad}>{cantidad}</option>)}
        </select>
      </label>
      <SelectorHora
        label="Hora de inicio"
        value={valores.horaInicio}
        onChange={(horaInicio) => setValores({ ...valores, horaInicio })}
      />
      <SelectorHora
        label="Hora de fin"
        value={valores.horaFin}
        onChange={(horaFin) => setValores({ ...valores, horaFin })}
      />
    </div>
    <button className="primary-button" onClick={crear}><Plus size={16} /> Crear asignación</button>
  </article>
}

function AgendaPanel({ onNotify }: { onNotify: (v: string) => void }) {
  const dispatch = useAppDispatch()
  const { agenda, cargando, error } = useAppSelector((state) => state.asignaciones)
  const [aulaId, setAulaId] = useState('')
  const [fecha, setFecha] = useState('')

  const consultar = async () => {
    if (!aulaId || !fecha) {
      onNotify('Completá el ID de aula y la fecha.')
      return
    }
    await dispatch(obtenerAgenda({ aulaId: Number(aulaId), fecha }))
  }

  return <article className="panel">
    <div className="form-grid" style={{ maxWidth: 420 }}>
      <label>ID de aula
        <select value={aulaId} onChange={(e) => setAulaId(e.target.value)}>
          <option value="">Seleccioná un aula...</option>
          {opcionesAsignacion.map((id) => <option key={id} value={id}>{id}</option>)}
        </select>
      </label>
      <CalendarDatePicker label="Fecha" value={fecha} onChange={setFecha} />
    </div>
    <button className="secondary-button" onClick={consultar}>Consultar agenda</button>
    {error && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {error}</div>}
    {cargando && <p className="muted-copy">Consultando...</p>}
    {!cargando && agenda.length > 0 && (
      <div className="table-wrap" style={{ marginTop: 18 }}>
        <table>
          <thead><tr><th>Asignatura</th><th>Horario</th><th>Estudiantes</th></tr></thead>
          <tbody>{agenda.map((a) => <tr key={a.id}><td><span className="code">#{a.asignaturaId}</span></td><td>{a.horaInicio} – {a.horaFin}</td><td>{a.cantidadEstudiantes}</td></tr>)}</tbody>
        </table>
      </div>
    )}
    {!cargando && agenda.length === 0 && <p className="muted-copy" style={{ marginTop: 12 }}>Consultá una fecha para ver la ocupación del aula.</p>}
  </article>
}
