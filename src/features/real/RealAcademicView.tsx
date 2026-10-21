import { Check, GraduationCap, PencilSimple, Plus, Trash, WarningCircle, X } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { CalendarDatePicker } from '../../components/ui/CalendarDatePicker'
import { EmptyState } from '../../components/ui/EmptyState'
import { SurfaceSkeleton } from '../../components/ui/SurfaceSkeleton'
import { AcademicSelect, type AcademicSelectOption } from '../../components/ui/AcademicSelect'
import { Toolbar } from '../../components/ui/Toolbar'
import {
  actualizarCarrera,
  crearCarrera,
  desactivarCarrera,
  listarCarreras,
} from '../../services/carreras/carrerasSlice'
import { crearPlanDeEstudio, listarPlanesDeEstudio } from '../../services/planesEstudio/planesEstudioSlice'
import { crearAsignatura, listarAsignaturas } from '../../services/asignaturas/asignaturasSlice'
import {
  crearCorrelatividad,
  listarCorrelatividades,
} from '../../services/correlatividades/correlatividadesSlice'
import type { Asignatura, Carrera, CrearCarrera, EstadoAcademico, PlanDeEstudio, TipoCorrelatividad } from '../../types/api'
import type { Screen } from '../../types/domain'
import {
  CODIGO_ACADEMICO_MENSAJE,
  esCodigoAcademicoValido,
  normalizarCodigoAcademico,
} from '../../utils/codigoAcademico'

type Props = { screen: Screen; query: string; setQuery: (value: string) => void; onNotify: (value: string) => void }

type EstadoOptionTone = 'success' | 'draft' | 'warning'
const estadoClase: Record<EstadoAcademico, EstadoOptionTone> = { ACTIVA: 'success', BORRADOR: 'draft', INACTIVA: 'warning' }
const estadoEtiqueta: Record<EstadoAcademico, string> = { ACTIVA: 'Activa', BORRADOR: 'Borrador', INACTIVA: 'Inactiva' }

const opcionesCarrera = (items: Carrera[]): AcademicSelectOption[] => items.map((carrera) => ({
  value: String(carrera.id),
  code: carrera.codigo,
  label: carrera.nombre,
  description: carrera.facultad,
  meta: carrera.duracion + ' · ' + carrera.titulo,
  badge: estadoEtiqueta[carrera.estado],
  badgeTone: estadoClase[carrera.estado],
}))

const fechaLegible = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split('-')
  return year && month && day ? day + '/' + month + '/' + year : value
}

const opcionesPlan = (items: PlanDeEstudio[]): AcademicSelectOption[] => items.map((plan) => ({
  value: String(plan.id),
  code: plan.codigo,
  label: plan.nombre,
  description: 'Vigente desde ' + fechaLegible(plan.vigenciaDesde),
  meta: plan.cantidadAsignaturas + ' asignaturas',
  badge: estadoEtiqueta[plan.estado],
  badgeTone: estadoClase[plan.estado],
}))

const opcionesAsignatura = (items: Asignatura[]): AcademicSelectOption[] => items.map((asignatura) => ({
  value: String(asignatura.id),
  code: asignatura.codigo,
  label: asignatura.nombre,
  description: 'Año ' + asignatura.anio + ' · ' + asignatura.creditos + ' créditos',
  meta: asignatura.cargaHoraria + ' hs de cursada',
  badge: estadoEtiqueta[asignatura.estado],
  badgeTone: estadoClase[asignatura.estado],
}))

export function RealAcademicView({ screen, query, setQuery, onNotify }: Props) {
  if (screen === 'Carreras') return <CarrerasPanel query={query} setQuery={setQuery} onNotify={onNotify} />
  if (screen === 'Planes de estudio') return <PlanesPanel onNotify={onNotify} />
  if (screen === 'Asignaturas') return <AsignaturasPanel onNotify={onNotify} />
  return <CorrelatividadesPanel onNotify={onNotify} />
}

const carreraVacia: CrearCarrera = { codigo: '', nombre: '', facultad: '', duracion: '', titulo: '' }
const opcionesAnioCalendario = Array.from({ length: new Date().getFullYear() - 1999 + 5 }, (_, index) => 2000 + index)

function CarrerasPanel({ query, setQuery, onNotify }: { query: string; setQuery: (value: string) => void; onNotify: (value: string) => void }) {
  const dispatch = useAppDispatch()
  const { items, cargando, error } = useAppSelector((state) => state.carreras)
  const [formAbierto, setFormAbierto] = useState<'nueva' | number | null>(null)
  const [valores, setValores] = useState<CrearCarrera>(carreraVacia)

  useEffect(() => {
    dispatch(listarCarreras())
  }, [dispatch])

  const rows = items.filter((carrera) => `${carrera.nombre} ${carrera.codigo} ${carrera.facultad}`.toLowerCase().includes(query.toLowerCase()))

  const abrirCreacion = () => {
    setValores(carreraVacia)
    setFormAbierto('nueva')
  }

  const abrirEdicion = (carrera: Carrera) => {
    setValores({ codigo: carrera.codigo, nombre: carrera.nombre, facultad: carrera.facultad, duracion: carrera.duracion, titulo: carrera.titulo })
    setFormAbierto(carrera.id)
  }

  const guardar = async () => {
    const requerido = [valores.codigo, valores.nombre, valores.facultad, valores.duracion, valores.titulo]
    if (requerido.some((valor) => !valor.trim())) {
      onNotify('Completá todos los campos de la carrera.')
      return
    }
    if (!esCodigoAcademicoValido(valores.codigo)) {
      onNotify(CODIGO_ACADEMICO_MENSAJE)
      return
    }
    if (!/^\d+\s*(años?|año|meses?)$/i.test(valores.duracion.trim())) {
      onNotify('Indicá la duración como una cantidad de años o meses, por ejemplo: 5 años.')
      return
    }
    if (formAbierto === 'nueva') {
      const resultado = await dispatch(crearCarrera(valores))
      if (crearCarrera.fulfilled.match(resultado)) {
        onNotify('Carrera creada correctamente')
        setFormAbierto(null)
      }
      return
    }
    const resultado = await dispatch(actualizarCarrera({ id: formAbierto as number, datos: valores }))
    if (actualizarCarrera.fulfilled.match(resultado)) {
      onNotify('Carrera actualizada')
      setFormAbierto(null)
    }
  }

  const desactivar = async (id: number) => {
    if (!window.confirm('¿Querés desactivar esta carrera?')) return
    const resultado = await dispatch(desactivarCarrera(id))
    if (desactivarCarrera.fulfilled.match(resultado)) onNotify('Carrera desactivada')
  }

  return <>
    <Toolbar query={query} setQuery={setQuery} placeholder="Buscar carreras..." filters={false} action={<button className="primary-button" onClick={abrirCreacion}><Plus size={17} /> Crear carrera</button>} />
    {error && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {error}</div>}

    {formAbierto !== null && (
      <article className="panel create-form-panel">
        <div className="panel-header"><div><h2>{formAbierto === 'nueva' ? 'Nueva carrera' : 'Editar carrera'}</h2></div><button className="text-button" onClick={() => setFormAbierto(null)}><X size={16} /></button></div>
        <div className="form-grid">
          <label>Código<input required maxLength={8} value={valores.codigo} onChange={(e) => setValores({ ...valores, codigo: normalizarCodigoAcademico(e.target.value) })} placeholder="Ej. ARQ-001" pattern="[A-Z]{3}[0-9]?-[0-9]{3}" title={CODIGO_ACADEMICO_MENSAJE} /><small>Formato: ARQ-001 o ARQ1-001</small></label>
          <label>Nombre<input required maxLength={120} value={valores.nombre} onChange={(e) => setValores({ ...valores, nombre: e.target.value })} placeholder="Ej. Ingeniería en Informática" /></label>
          <label>Facultad<input required maxLength={120} value={valores.facultad} onChange={(e) => setValores({ ...valores, facultad: e.target.value })} placeholder="Ej. Facultad de Ingeniería" /></label>
          <label>Duración (años)
            <input type="number" inputMode="numeric" min="1" max="15" step="1" required value={valores.duracion.match(/^\d+/)?.[0] ?? ''} onChange={(e) => setValores({ ...valores, duracion: e.target.value ? `${e.target.value} años` : '' })} />
            <small>Ingresá la duración total en años.</small>
          </label>
          <label>Título que otorga<input required maxLength={120} value={valores.titulo} onChange={(e) => setValores({ ...valores, titulo: e.target.value })} placeholder="Ej. Ingeniero/a en Informática" /></label>
        </div>
        <button className="primary-button" onClick={guardar}><Check size={16} /> Guardar</button>
      </article>
    )}

    <div className="list-meta"><span>{rows.length} resultados</span></div>
    {cargando && items.length === 0 ? <SurfaceSkeleton label="carreras" /> : (
      <div className="table-wrap">
        <table>
          <thead><tr><th>Código</th><th>Nombre</th><th>Facultad</th><th>Estado</th><th aria-label="Acciones" /></tr></thead>
          <tbody>
            {rows.map((carrera) => (
              <tr key={carrera.id}>
                <td><span className="code">{carrera.codigo}</span></td>
                <td><strong>{carrera.nombre}</strong><small>{carrera.titulo} · {carrera.duracion}</small></td>
                <td>{carrera.facultad}</td>
                <td><span className={`status ${estadoClase[carrera.estado]}`}><i />{carrera.estado}</span></td>
                <td>
                  <button className="row-action" onClick={() => abrirEdicion(carrera)} aria-label={`Editar ${carrera.nombre}`}><PencilSimple size={17} /></button>
                  {carrera.estado !== 'INACTIVA' && <button className="row-action danger" onClick={() => desactivar(carrera.id)} aria-label={`Desactivar ${carrera.nombre}`}><Trash size={17} /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!cargando && rows.length === 0 && <EmptyState query={query} />}
      </div>
    )}
  </>
}

function PlanesPanel({ onNotify }: { onNotify: (value: string) => void }) {
  const dispatch = useAppDispatch()
  const carreras = useAppSelector((state) => state.carreras)
  const planes = useAppSelector((state) => state.planesEstudio)
  const [carreraId, setCarreraId] = useState<number | null>(null)
  const [formAbierto, setFormAbierto] = useState(false)
  const [valores, setValores] = useState({ codigo: '', nombre: '', vigenciaDesde: '', cantidadAsignaturas: '' })
  const carreraSeleccionada = carreras.items.find((carrera) => carrera.id === carreraId)

  useEffect(() => {
    dispatch(listarCarreras())
  }, [dispatch])

  useEffect(() => {
    if (carreraId) dispatch(listarPlanesDeEstudio(carreraId))
  }, [dispatch, carreraId])

  const crear = async () => {
    if (!carreraId) return
    if (!esCodigoAcademicoValido(valores.codigo)) {
      onNotify(CODIGO_ACADEMICO_MENSAJE)
      return
    }
    if (!valores.nombre.trim() || !valores.vigenciaDesde || !Number.isInteger(Number(valores.cantidadAsignaturas)) || Number(valores.cantidadAsignaturas) < 1) {
      onNotify('Completá el año, la fecha de vigencia y una cantidad válida de asignaturas.')
      return
    }
    const resultado = await dispatch(crearPlanDeEstudio({
      carreraId,
      datos: { ...valores, cantidadAsignaturas: Number(valores.cantidadAsignaturas) },
    }))
    if (crearPlanDeEstudio.fulfilled.match(resultado)) {
      onNotify('Plan de estudio creado correctamente')
      setValores({ codigo: '', nombre: '', vigenciaDesde: '', cantidadAsignaturas: '' })
      setFormAbierto(false)
    }
  }

  return <>
    {carreras.error && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {carreras.error}</div>}
    <section className="panel academic-selection-panel">
      <div className="academic-selection-header">
        <span className="academic-selection-icon"><GraduationCap size={20} aria-hidden="true" /></span>
        <div className="academic-selection-copy">
          <span className="academic-selection-kicker">PLANES POR CARRERA</span>
          <h2>Elegí una carrera</h2>
          <p>Buscá por nombre, código o facultad. El selector muestra su duración y el título que otorga.</p>
        </div>
      </div>
      <AcademicSelect
        label="Carrera"
        value={carreraId ? String(carreraId) : ''}
        onChange={(value) => setCarreraId(value ? Number(value) : null)}
        options={opcionesCarrera(carreras.items)}
        placeholder="Seleccioná una carrera"
        searchPlaceholder="Buscar carrera por código, nombre o facultad"
        helperText="Elegí una carrera para consultar o crear sus planes de estudio."
        emptyMessage="Todavía no hay carreras disponibles."
        noResultsMessage="No hay carreras que coincidan con esa búsqueda."
        loading={carreras.cargando}
        clearable
      />
      {carreraSeleccionada && (
        <div className="academic-context" aria-label="Datos de la carrera seleccionada">
          <div className="academic-context-item"><small>FACULTAD</small><strong>{carreraSeleccionada.facultad}</strong></div>
          <div className="academic-context-item"><small>DURACIÓN</small><strong>{carreraSeleccionada.duracion}</strong></div>
          <div className="academic-context-item"><small>TÍTULO</small><strong>{carreraSeleccionada.titulo}</strong></div>
        </div>
      )}
    </section>

    {!carreraId
      ? <div className="academic-next-step">
          <span className="academic-next-step__icon"><GraduationCap size={19} aria-hidden="true" /></span>
          <div><strong>Los planes aparecerán aquí</strong><p>Seleccioná una carrera para consultar los planes vigentes y crear uno nuevo.</p></div>
        </div>
      : <>
          {planes.error && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {planes.error}</div>}
          <div className="list-meta"><span>{planes.items.length} planes</span><button className="text-button" onClick={() => setFormAbierto((v) => !v)}>{formAbierto ? 'Cancelar' : '+ Crear plan'}</button></div>

          {formAbierto && (
            <article className="panel create-form-panel">
              <div className="form-grid">
                <label>Código<input value={valores.codigo} maxLength={8} onChange={(e) => setValores({ ...valores, codigo: normalizarCodigoAcademico(e.target.value) })} placeholder="Ej. ARQ-001" pattern="[A-Z]{3}[0-9]?-[0-9]{3}" title={CODIGO_ACADEMICO_MENSAJE} /><small>Formato: ARQ-001 o ARQ1-001</small></label>
                <label>Año del plan<select value={valores.nombre.replace('Plan de estudio ', '')} onChange={(e) => setValores({ ...valores, nombre: `Plan de estudio ${e.target.value}` })}><option value="">Seleccioná el año</option>{opcionesAnioCalendario.map((anio) => <option key={anio} value={anio}>{anio}</option>)}</select></label>
                <CalendarDatePicker label="Vigente desde" value={valores.vigenciaDesde} onChange={(vigenciaDesde) => setValores({ ...valores, vigenciaDesde })} />
                <label>Cantidad de asignaturas<input type="number" min="0" value={valores.cantidadAsignaturas} onChange={(e) => setValores({ ...valores, cantidadAsignaturas: e.target.value })} /></label>
              </div>
              <button className="primary-button" onClick={crear}><Check size={16} /> Guardar</button>
            </article>
          )}

          {planes.cargando && planes.items.length === 0 ? <SurfaceSkeleton label="planes de estudio" /> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Código</th><th>Nombre</th><th>Vigente desde</th><th>Asignaturas</th><th>Estado</th></tr></thead>
                <tbody>
                  {planes.items.map((plan) => (
                    <tr key={plan.id}>
                      <td><span className="code">{plan.codigo}</span></td>
                      <td><strong>{plan.nombre}</strong></td>
                      <td>{plan.vigenciaDesde}</td>
                      <td>{plan.cantidadAsignaturas}</td>
                      <td><span className={`status ${estadoClase[plan.estado]}`}><i />{plan.estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!planes.cargando && planes.items.length === 0 && <EmptyState query="" />}
            </div>
          )}
        </>}
  </>
}

const opcionesCargaHoraria = [0, 68, 98, 108, 118, 168]
const opcionesCreditos = [0, 4, 6, 8, 10, 12, 14, 16, 18, 20]
const opcionesAnio = [1, 2, 3, 4, 5]

function AsignaturasPanel({ onNotify }: { onNotify: (value: string) => void }) {
  const dispatch = useAppDispatch()
  const carreras = useAppSelector((state) => state.carreras)
  const planes = useAppSelector((state) => state.planesEstudio)
  const asignaturas = useAppSelector((state) => state.asignaturas)
  const [carreraId, setCarreraId] = useState<number | null>(null)
  const [planId, setPlanId] = useState<number | null>(null)
  const [formAbierto, setFormAbierto] = useState(false)
  const [valores, setValores] = useState({ codigo: '', nombre: '', anio: '', creditos: '', cargaHoraria: '' })

  useEffect(() => {
    dispatch(listarCarreras())
  }, [dispatch])
  useEffect(() => {
    if (carreraId) dispatch(listarPlanesDeEstudio(carreraId))
  }, [dispatch, carreraId])
  useEffect(() => {
    if (planId) dispatch(listarAsignaturas(planId))
  }, [dispatch, planId])

  const seleccionarCarrera = (value: string) => {
    setCarreraId(value ? Number(value) : null)
    setPlanId(null)
  }

  const crear = async () => {
    if (!planId) return
    if (!esCodigoAcademicoValido(valores.codigo)) {
      onNotify(CODIGO_ACADEMICO_MENSAJE)
      return
    }
    if (!valores.nombre.trim()) {
      onNotify('Ingresá el nombre de la asignatura.')
      return
    }
    if (valores.anio === '') {
      onNotify('Seleccioná el año de cursada.')
      return
    }
    if (valores.creditos === '') {
      onNotify('Seleccioná la cantidad de créditos.')
      return
    }
    if (valores.cargaHoraria === '') {
      onNotify('Seleccioná una carga horaria.')
      return
    }
    const resultado = await dispatch(crearAsignatura({
      planId,
      datos: { ...valores, anio: Number(valores.anio), creditos: Number(valores.creditos), cargaHoraria: Number(valores.cargaHoraria) },
    }))
    if (crearAsignatura.fulfilled.match(resultado)) {
      onNotify('Asignatura creada correctamente')
      setValores({ codigo: '', nombre: '', anio: '', creditos: '', cargaHoraria: '' })
      setFormAbierto(false)
    }
  }

  return <>
    <div className="academic-filter-grid">
      <AcademicSelect
        label="Carrera"
        value={carreraId ? String(carreraId) : ''}
        onChange={seleccionarCarrera}
        options={opcionesCarrera(carreras.items)}
        placeholder="Seleccioná una carrera"
        searchPlaceholder="Buscar por nombre, código o facultad"
        helperText="La carrera determina los planes disponibles."
        emptyMessage="Todavía no hay carreras disponibles."
        noResultsMessage="No hay carreras que coincidan con esa búsqueda."
        loading={carreras.cargando}
        clearable
      />
      <AcademicSelect
        label="Plan de estudio"
        value={planId ? String(planId) : ''}
        onChange={(value) => setPlanId(value ? Number(value) : null)}
        options={opcionesPlan(planes.items)}
        placeholder="Seleccioná un plan"
        searchPlaceholder="Buscar plan por nombre o código"
        helperText={carreraId ? 'Elegí el plan donde vas a crear la asignatura.' : 'Primero elegí una carrera.'}
        emptyMessage="Esta carrera todavía no tiene planes."
        noResultsMessage="No hay planes que coincidan con esa búsqueda."
        loading={planes.cargando}
        disabled={!carreraId}
        clearable
      />
    </div>

    {!planId
      ? <p className="muted-copy">Elegí una carrera y un plan de estudio para ver sus asignaturas.</p>
      : <>
          {asignaturas.error && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {asignaturas.error}</div>}
          <div className="list-meta"><span>{asignaturas.items.length} asignaturas</span><button className="text-button" onClick={() => setFormAbierto((v) => !v)}>{formAbierto ? 'Cancelar' : '+ Crear asignatura'}</button></div>

          {formAbierto && (
            <article className="panel create-form-panel">
              <div className="form-grid">
                <label>Código<input value={valores.codigo} onChange={(e) => setValores({ ...valores, codigo: normalizarCodigoAcademico(e.target.value) })} placeholder="Ej. ARQ1-001" pattern="[A-Z]{3}[0-9]?-[0-9]{3}" title={CODIGO_ACADEMICO_MENSAJE} /><small>Formato: ARQ-001 o ARQ1-001</small></label>
                <label>Nombre<input value={valores.nombre} onChange={(e) => setValores({ ...valores, nombre: e.target.value })} placeholder="Ej. Desarrollo de Aplicaciones II" /></label>
                <label>Año
                  <select value={valores.anio} onChange={(e) => setValores({ ...valores, anio: e.target.value })}>
                    <option value="">Seleccioná el año</option>
                    {opcionesAnio.map((anio) => <option key={anio} value={anio}>{anio}</option>)}
                  </select>
                </label>
                <label>Créditos
                  <select value={valores.creditos} onChange={(e) => setValores({ ...valores, creditos: e.target.value })}>
                    <option value="">Seleccioná los créditos</option>
                    {opcionesCreditos.map((creditos) => <option key={creditos} value={creditos}>{creditos}</option>)}
                  </select>
                </label>
                <label>Carga horaria (hs)
                  <select value={valores.cargaHoraria} onChange={(e) => setValores({ ...valores, cargaHoraria: e.target.value })}>
                    <option value="">Seleccioná una carga horaria</option>
                    {opcionesCargaHoraria.map((horas) => <option key={horas} value={horas}>{horas}hs</option>)}
                  </select>
                </label>
              </div>
              <button className="primary-button" onClick={crear}><Check size={16} /> Guardar</button>
            </article>
          )}

          {asignaturas.cargando && asignaturas.items.length === 0 ? <SurfaceSkeleton label="asignaturas" /> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Código</th><th>Nombre</th><th>Año</th><th>Créditos</th><th>Carga horaria</th><th>Estado</th></tr></thead>
                <tbody>
                  {asignaturas.items.map((asignatura) => (
                    <tr key={asignatura.id}>
                      <td><span className="code">{asignatura.codigo}</span></td>
                      <td><strong>{asignatura.nombre}</strong></td>
                      <td>{asignatura.anio}</td>
                      <td>{asignatura.creditos}</td>
                      <td>{asignatura.cargaHoraria} hs</td>
                      <td><span className={`status ${estadoClase[asignatura.estado]}`}><i />{asignatura.estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!asignaturas.cargando && asignaturas.items.length === 0 && <EmptyState query="" />}
            </div>
          )}
        </>}
  </>
}

function CorrelatividadesPanel({ onNotify }: { onNotify: (value: string) => void }) {
  const dispatch = useAppDispatch()
  const carreras = useAppSelector((state) => state.carreras)
  const planes = useAppSelector((state) => state.planesEstudio)
  const asignaturas = useAppSelector((state) => state.asignaturas)
  const correlatividades = useAppSelector((state) => state.correlatividades)
  const [carreraId, setCarreraId] = useState<number | null>(null)
  const [planId, setPlanId] = useState<number | null>(null)
  const [asignaturaId, setAsignaturaId] = useState<number | null>(null)
  const [correlativaId, setCorrelativaId] = useState('')
  const [tipo, setTipo] = useState<TipoCorrelatividad>('REGULAR')

  useEffect(() => { dispatch(listarCarreras()) }, [dispatch])
  useEffect(() => { if (carreraId) dispatch(listarPlanesDeEstudio(carreraId)) }, [dispatch, carreraId])
  useEffect(() => { if (planId) dispatch(listarAsignaturas(planId)) }, [dispatch, planId])
  useEffect(() => { if (asignaturaId) dispatch(listarCorrelatividades(asignaturaId)) }, [dispatch, asignaturaId])

  const seleccionarCarrera = (value: string) => {
    setCarreraId(value ? Number(value) : null)
    setPlanId(null)
    setAsignaturaId(null)
  }

  const seleccionarPlan = (value: string) => {
    setPlanId(value ? Number(value) : null)
    setAsignaturaId(null)
  }

  const opciones = asignaturas.items.filter((a) => a.id !== asignaturaId)

  const agregar = async () => {
    if (!asignaturaId || !correlativaId) {
      onNotify('Seleccioná una asignatura correlativa.')
      return
    }
    const resultado = await dispatch(crearCorrelatividad({ asignaturaId, datos: { correlativaId: Number(correlativaId), tipo } }))
    if (crearCorrelatividad.fulfilled.match(resultado)) {
      onNotify('Correlatividad agregada')
      setCorrelativaId('')
    }
  }

  return <>
    <div className="academic-filter-grid">
      <AcademicSelect
        label="Carrera"
        value={carreraId ? String(carreraId) : ''}
        onChange={seleccionarCarrera}
        options={opcionesCarrera(carreras.items)}
        placeholder="Seleccioná una carrera"
        searchPlaceholder="Buscar por nombre, código o facultad"
        helperText="Elegí primero la carrera del plan."
        emptyMessage="Todavía no hay carreras disponibles."
        noResultsMessage="No hay carreras que coincidan con esa búsqueda."
        loading={carreras.cargando}
        clearable
      />
      <AcademicSelect
        label="Plan de estudio"
        value={planId ? String(planId) : ''}
        onChange={seleccionarPlan}
        options={opcionesPlan(planes.items)}
        placeholder="Seleccioná un plan"
        searchPlaceholder="Buscar plan por nombre o código"
        helperText={carreraId ? 'Seleccioná el plan con las asignaturas.' : 'Primero elegí una carrera.'}
        emptyMessage="Esta carrera todavía no tiene planes."
        noResultsMessage="No hay planes que coincidan con esa búsqueda."
        loading={planes.cargando}
        disabled={!carreraId}
        clearable
      />
      <AcademicSelect
        label="Asignatura"
        value={asignaturaId ? String(asignaturaId) : ''}
        onChange={(value) => setAsignaturaId(value ? Number(value) : null)}
        options={opcionesAsignatura(asignaturas.items)}
        placeholder="Seleccioná una asignatura"
        searchPlaceholder="Buscar asignatura por código o nombre"
        helperText={planId ? 'Elegí la materia cuyas correlatividades querés revisar.' : 'Primero elegí un plan.'}
        emptyMessage="Este plan todavía no tiene asignaturas."
        noResultsMessage="No hay asignaturas que coincidan con esa búsqueda."
        loading={asignaturas.cargando}
        disabled={!planId}
        clearable
      />
    </div>

    {!asignaturaId
      ? <p className="muted-copy">Elegí una asignatura para ver y agregar sus correlatividades.</p>
      : <article className="panel">
          {correlatividades.error && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {correlatividades.error}</div>}
          <div className="detail-label">CORRELATIVIDADES REQUERIDAS <span>{correlatividades.items.length}</span></div>
          {correlatividades.items.length === 0 && <p className="muted-copy">No hay correlatividades configuradas.</p>}
          {correlatividades.items.map((correlatividad) => {
            const requerida = asignaturas.items.find((a) => a.id === correlatividad.correlativaId)
            return <div className="requirement" key={correlatividad.id}>
              <span><strong>{requerida?.nombre ?? `Asignatura #${correlatividad.correlativaId}`}</strong><small>{requerida?.codigo} · {correlatividad.tipo}</small></span>
            </div>
          })}
          <div className="correlative-add">
            <AcademicSelect
              label="Materia correlativa"
              value={correlativaId}
              onChange={setCorrelativaId}
              options={opcionesAsignatura(opciones)}
              placeholder="Seleccioná una asignatura"
              searchPlaceholder="Buscar correlativa por código o nombre"
              helperText="Materia que debe regularizarse o aprobarse antes."
              emptyMessage="No hay otras asignaturas disponibles."
              noResultsMessage="No hay asignaturas que coincidan con esa búsqueda."
              loading={asignaturas.cargando}
              clearable
            />
            <AcademicSelect
              label="Requisito"
              value={tipo}
              onChange={(value) => setTipo(value as TipoCorrelatividad)}
              options={[
                { value: 'REGULAR', label: 'Regular', description: 'Alcanza con tener la materia regularizada.' },
                { value: 'APROBADA', label: 'Aprobada', description: 'La materia debe estar aprobada.' },
              ]}
              placeholder="Elegí el requisito"
              searchPlaceholder="Buscar requisito"
              helperText="Definí qué condición tiene que cumplir."
              emptyMessage="No hay requisitos disponibles."
            />
            <button className="secondary-button" onClick={agregar}><Plus size={16} /> Agregar correlativa</button>
          </div>
        </article>}
  </>
}
