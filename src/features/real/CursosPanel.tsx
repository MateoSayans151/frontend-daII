import { ArrowLeft, Check, Plus, WarningCircle } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { CalendarDatePicker } from '../../components/ui/CalendarDatePicker'
import { AcademicSelect, type AcademicSelectOption } from '../../components/ui/AcademicSelect'
import { EmptyState } from '../../components/ui/EmptyState'
import { SurfaceSkeleton } from '../../components/ui/SurfaceSkeleton'
import { Toolbar } from '../../components/ui/Toolbar'
import { extraerMensajeError } from '../../services/api/erroresApi'
import { catalogosService, type AulaCatalogo } from '../../services/catalogos/catalogosService'
import {
  asignarDocenteCurso,
  actualizarInscripcionCurso,
  actualizarEstadoCurso,
  actualizarHorarioCurso,
  crearCurso,
  inscribirAlumnoCurso,
  limpiarCursoSeleccionado,
  listarCursos,
  obtenerCurso,
} from '../../services/cursos/cursosSlice'
import type { ActualizarInscripcionCurso, Asignatura, CursoDetalle, CrearCurso, PeriodoAcademico, Sede } from '../../types/api'
import {
  CODIGO_ACADEMICO_MENSAJE,
  esCodigoAcademicoValido,
  normalizarCodigoAcademico,
} from '../../utils/codigoAcademico'

const cursoVacio: CrearCurso = {
  codigo: '',
  asignaturaId: 0,
  periodoId: 0,
  sedeId: 0,
  modalidad: '',
  cupoMaximo: 0,
  fechaInicio: '',
  fechaFin: '',
  turno: '',
  horaInicio: '',
  horaFin: '',
  diaSemana: '',
  aulaId: 0,
}

const docenteVacio = { docenteId: '', rol: '' }
const inscripcionVacia = { alumnoId: '' }
const resultadoVacio: ActualizarInscripcionCurso & { alumnoId: string } = {
  alumnoId: '',
  estado: '',
  notaFinal: null,
  fechaResultado: '',
}

const diasSemana = [
  { value: 'MONDAY', label: 'Lunes' },
  { value: 'TUESDAY', label: 'Martes' },
  { value: 'WEDNESDAY', label: 'Miércoles' },
  { value: 'THURSDAY', label: 'Jueves' },
  { value: 'FRIDAY', label: 'Viernes' },
  { value: 'SATURDAY', label: 'Sábado' },
  { value: 'SUNDAY', label: 'Domingo' },
]

const modalidades = [
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'VIRTUAL', label: 'Virtual' },
  { value: 'HIBRIDA', label: 'Híbrida' },
]

const estadosCurso = [
  { value: 'PLANIFICADO', label: 'Planificado' },
  { value: 'EN_CURSO', label: 'En curso' },
  { value: 'FINALIZADO', label: 'Finalizado' },
  { value: 'CANCELADO', label: 'Cancelado' },
]

const rolesDocente = [
  { value: 'TITULAR', label: 'Titular' },
  { value: 'ADJUNTO', label: 'Adjunto' },
  { value: 'AUXILIAR', label: 'Auxiliar' },
]

const estadosInscripcion = [
  { value: 'INSCRIPTO', label: 'Inscripto' },
  { value: 'CURSANDO', label: 'Cursando' },
  { value: 'BAJA', label: 'Baja' },
  { value: 'REGULAR', label: 'Regular' },
  { value: 'LIBRE', label: 'Libre' },
  { value: 'APROBADO', label: 'Aprobado' },
  { value: 'DESAPROBADO', label: 'Desaprobado' },
]

function fechaBreve(fecha: string) {
  const [anio, mes, dia] = fecha.slice(0, 10).split('-').map(Number)
  if (!anio || !mes || !dia) return fecha
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(anio, mes - 1, dia)))
}

const nombreDia = (dia: string | null) => diasSemana.find((opcion) => opcion.value === dia)?.label ?? 'Sin día'
const nombreModalidad = (modalidad: string) => modalidades.find((opcion) => opcion.value === modalidad)?.label ?? modalidad
const nombreEstadoCurso = (estado: string) => estadosCurso.find((opcion) => opcion.value === estado)?.label ?? estado

export function CursosPanel({ query, setQuery, onNotify }: { query: string; setQuery: (value: string) => void; onNotify: (value: string) => void }) {
  const dispatch = useAppDispatch()
  const { items, seleccionado, cargando, cargandoDetalle, error } = useAppSelector((state) => state.cursos)
  const [periodoId, setPeriodoId] = useState('')
  const [filtroPeriodo, setFiltroPeriodo] = useState<number | undefined>()
  const [formAbierto, setFormAbierto] = useState(false)
  const [valores, setValores] = useState<CrearCurso>(cursoVacio)
  const [cursoAbiertoId, setCursoAbiertoId] = useState<number | null>(null)
  const [catalogos, setCatalogos] = useState<{
    asignaturas: Asignatura[]
    periodos: PeriodoAcademico[]
    sedes: Sede[]
    aulas: AulaCatalogo[]
  }>({ asignaturas: [], periodos: [], sedes: [], aulas: [] })
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true)
  const [errorCatalogos, setErrorCatalogos] = useState('')
  const [errorAulas, setErrorAulas] = useState('')

  useEffect(() => {
    dispatch(listarCursos(filtroPeriodo))
  }, [dispatch, filtroPeriodo])

  useEffect(() => {
    let activo = true
    catalogosService.paraPlanificacion()
      .then((datos) => {
        if (activo) {
          setCatalogos(datos)
          setErrorCatalogos(datos.advertencias.join(' '))
          setErrorAulas(datos.advertencias.filter((advertencia) => advertencia.toLowerCase().includes('aulas')).join(' '))
        }
      })
      .catch((error) => {
        if (activo) {
          const mensaje = extraerMensajeError(error, 'No se pudieron cargar los datos para crear cursos')
          setErrorCatalogos(mensaje)
          setErrorAulas(mensaje)
        }
      })
      .finally(() => {
        if (activo) setCargandoCatalogos(false)
      })
    return () => { activo = false }
  }, [])

  const rows = items.filter((curso) => {
    const asignatura = catalogos.asignaturas.find((item) => item.id === curso.asignaturaId)
    const periodo = catalogos.periodos.find((item) => item.id === curso.periodoId)
    const sede = catalogos.sedes.find((item) => item.id === curso.sedeId)
    const aula = catalogos.aulas.find((item) => item.id === curso.aulaId)
    return [
      curso.codigo,
      asignatura?.codigo,
      asignatura?.nombre,
      periodo && `${periodo.anio} ${periodo.numero} cuatrimestre`,
      sede?.nombre ?? curso.sedeNombre,
      aula?.codigo,
      aula?.nombre ?? curso.aulaNombre,
      curso.modalidad,
    ].filter(Boolean).join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase())
  })

  const abrirDetalle = (id: number) => {
    setCursoAbiertoId(id)
    dispatch(obtenerCurso(id))
  }

  const aplicarFiltroPeriodo = () => {
    if (periodoId && (!Number.isInteger(Number(periodoId)) || Number(periodoId) < 1)) {
      onNotify('Seleccioná un período válido.')
      return
    }
    setFiltroPeriodo(periodoId ? Number(periodoId) : undefined)
  }

  const crear = async () => {
    if (!esCodigoAcademicoValido(valores.codigo)) {
      onNotify(CODIGO_ACADEMICO_MENSAJE)
      return
    }
    if (
      !valores.codigo.trim() ||
      !Number.isInteger(valores.asignaturaId) ||
      valores.asignaturaId <= 0 ||
      !Number.isInteger(valores.periodoId) ||
      valores.periodoId < 1 ||
      !Number.isInteger(valores.sedeId) ||
      valores.sedeId <= 0 ||
      !valores.modalidad.trim() ||
      !Number.isInteger(valores.cupoMaximo) ||
      valores.cupoMaximo <= 0 ||
      !valores.fechaInicio ||
      !valores.fechaFin ||
      !valores.turno ||
      !valores.diaSemana ||
      !Number.isInteger(valores.aulaId) ||
      valores.aulaId <= 0 ||
      !valores.horaInicio ||
      !valores.horaFin
    ) {
      onNotify('Completá todos los campos del curso con valores válidos.')
      return
    }
    if (valores.fechaInicio > valores.fechaFin) {
      onNotify('La fecha de inicio no puede ser posterior a la fecha de fin.')
      return
    }
    if (valores.horaInicio >= valores.horaFin) {
      onNotify('La hora de fin debe ser posterior a la de inicio.')
      return
    }
    const resultado = await dispatch(crearCurso(valores))
    if (crearCurso.fulfilled.match(resultado)) {
      onNotify('Curso creado correctamente')
      setValores(cursoVacio)
      setFormAbierto(false)
      dispatch(listarCursos(filtroPeriodo))
    }
  }

  const aulasDeSede = catalogos.aulas.filter((aula) => aula.sedeId === valores.sedeId)
  const opcionesAsignatura: AcademicSelectOption[] = catalogos.asignaturas.map((asignatura) => ({
    value: String(asignatura.id), label: asignatura.nombre, code: asignatura.codigo,
    description: `Año ${asignatura.anio} · ${asignatura.creditos} créditos`,
  }))
  const opcionesPeriodo: AcademicSelectOption[] = catalogos.periodos.map((periodo) => ({
    value: String(periodo.id), label: `${periodo.numero}.º cuatrimestre ${periodo.anio}`,
    meta: `${periodo.fechaInicio} — ${periodo.fechaFin}`,
  }))
  const opcionesSede: AcademicSelectOption[] = catalogos.sedes.map((sede) => ({
    value: String(sede.id), label: sede.nombre, description: sede.direccion,
  }))
  const opcionesAula: AcademicSelectOption[] = aulasDeSede.map((aula) => ({
    value: String(aula.id), label: aula.nombre, code: aula.codigo,
    description: aula.sedeNombre, meta: `Capacidad: ${aula.capacidadMaxima}`,
  }))

  if (cursoAbiertoId !== null) {
    const curso = seleccionado?.id === cursoAbiertoId ? seleccionado : null
    return (
      <section>
        <button
          className="secondary-button"
          type="button"
          onClick={() => {
            setCursoAbiertoId(null)
            dispatch(limpiarCursoSeleccionado())
          }}
        >
          <ArrowLeft size={16} /> Volver a cursos
        </button>
        {error && <ErrorMessage message={error} />}
        {cargandoDetalle && !curso && <SurfaceSkeleton label="el curso" rows={3} />}
        {curso && (
          <DetalleCurso
            curso={curso}
            catalogos={catalogos}
            aulas={catalogos.aulas}
            cargandoAulas={cargandoCatalogos}
            errorAulas={errorAulas}
            onNotify={onNotify}
            onRefresh={() => dispatch(obtenerCurso(curso.id))}
          />
        )}
      </section>
    )
  }

  return (
    <>
      <Toolbar
        query={query}
        setQuery={setQuery}
        placeholder="Buscar por código, asignatura, sede o aula..."
        filters={false}
        action={<button className="primary-button" type="button" onClick={() => setFormAbierto((abierto) => !abierto)}>{formAbierto ? 'Cancelar' : <><Plus size={17} /> Crear curso</>}</button>}
      />
      <div className="list-meta">
        <span>{rows.length} cursos · Usá el filtro de período para reducir la lista</span>
      </div>
      <div className="panel course-filter-panel">
        <div className="form-grid course-filter-grid">
          <label>
            Período
            <select
              value={periodoId}
              onChange={(event) => setPeriodoId(event.target.value)}
            >
              <option value="">Todos los períodos</option>
              {catalogos.periodos.map((periodo) => (
                <option key={periodo.id} value={periodo.id}>
                  {periodo.anio}-{periodo.numero} - {periodo.numero}° cuatrimestre
                </option>
              ))}
            </select>
          </label>
          <button className="secondary-button" type="button" onClick={aplicarFiltroPeriodo}>
            Aplicar filtro
          </button>
        </div>
      </div>
      {error && <ErrorMessage message={error} />}
      {errorCatalogos && <ErrorMessage message={errorCatalogos} />}
      {formAbierto && (
        <article className="panel course-create-panel" aria-busy={cargandoCatalogos}>
          <h2>Nuevo curso</h2>
          <p className="muted-copy">Completá los datos del curso y vinculalo con su período, sede y asignatura.</p>
          {cargandoCatalogos && <p className="muted-copy" role="status">Cargando asignaturas, períodos, sedes y aulas...</p>}
          <div className="form-grid">
            <label>
              Código
              <input required maxLength={8} value={valores.codigo} onChange={(event) => setValores({ ...valores, codigo: normalizarCodigoAcademico(event.target.value) })} placeholder="Ej. ARQ1-001" pattern="[A-Z]{3}[0-9]?-[0-9]{3}" title={CODIGO_ACADEMICO_MENSAJE} />
              <small>Formato: ARQ-001 o ARQ1-001</small>
            </label>
            <AcademicSelect label="Asignatura" value={String(valores.asignaturaId || '')} options={opcionesAsignatura} onChange={(value) => setValores({ ...valores, asignaturaId: Number(value) })} placeholder="Seleccioná una asignatura" searchPlaceholder="Buscar asignatura por nombre o código..." emptyMessage="No hay asignaturas disponibles." loading={cargandoCatalogos} disabled={!cargandoCatalogos && opcionesAsignatura.length === 0} />
            <AcademicSelect label="Período" value={String(valores.periodoId || '')} options={opcionesPeriodo} onChange={(value) => setValores({ ...valores, periodoId: Number(value) })} placeholder="Seleccioná un período" searchPlaceholder="Buscar período..." emptyMessage="No hay períodos disponibles." loading={cargandoCatalogos} disabled={!cargandoCatalogos && opcionesPeriodo.length === 0} />
            <AcademicSelect label="Sede" value={String(valores.sedeId || '')} options={opcionesSede} onChange={(value) => setValores({ ...valores, sedeId: Number(value), aulaId: 0 })} placeholder="Seleccioná una sede" searchPlaceholder="Buscar sede..." emptyMessage="No hay sedes disponibles." loading={cargandoCatalogos} disabled={!cargandoCatalogos && opcionesSede.length === 0} />
            <label>
              Modalidad
              <select value={valores.modalidad} onChange={(event) => setValores({ ...valores, modalidad: event.target.value })}>
                <option value="">Seleccioná una modalidad...</option>
                {modalidades.map((modalidad) => <option key={modalidad.value} value={modalidad.value}>{modalidad.label}</option>)}
              </select>
            </label>
            <label>
              Cupo máximo
              <input type="number" inputMode="numeric" min="1" step="1" value={valores.cupoMaximo || ''} onChange={(event) => setValores({ ...valores, cupoMaximo: Number(event.target.value) })} />
            </label>
            <CalendarDatePicker label="Fecha de inicio" value={valores.fechaInicio} onChange={(fechaInicio) => setValores({ ...valores, fechaInicio })} />
            <CalendarDatePicker label="Fecha de fin" value={valores.fechaFin} onChange={(fechaFin) => setValores({ ...valores, fechaFin })} />
          </div>
          <div className="form-grid">
            <label>Turno
              <select value={valores.turno} onChange={(event) => setValores({ ...valores, turno: event.target.value as CrearCurso['turno'] })}>
                <option value="">Seleccioná un turno...</option>
                <option value="MAÑANA">Mañana</option>
                <option value="TARDE">Tarde</option>
                <option value="NOCHE">Noche</option>
              </select>
            </label>
            <label>Día de la semana
              <select value={valores.diaSemana} onChange={(event) => setValores({ ...valores, diaSemana: event.target.value })}>
                <option value="">Seleccioná un día...</option>
                {diasSemana.map((dia) => <option key={dia.value} value={dia.value}>{dia.label}</option>)}
              </select>
            </label>
            <AcademicSelect label="Aula" value={String(valores.aulaId || '')} options={opcionesAula} onChange={(value) => setValores({ ...valores, aulaId: Number(value) })} placeholder={!valores.sedeId ? 'Primero seleccioná una sede' : 'Seleccioná un aula'} searchPlaceholder="Buscar aula por nombre o código..." emptyMessage={!valores.sedeId ? 'Seleccioná una sede para ver sus aulas.' : 'No hay aulas para esta sede.'} loading={cargandoCatalogos} disabled={!valores.sedeId || cargandoCatalogos || opcionesAula.length === 0} />
            <label>Hora de inicio
              <input type="time" value={valores.horaInicio} onChange={(event) => setValores({ ...valores, horaInicio: event.target.value })} />
            </label>
            <label>Hora de fin
              <input type="time" value={valores.horaFin} onChange={(event) => setValores({ ...valores, horaFin: event.target.value })} />
            </label>
          </div>
          <button className="primary-button" type="button" onClick={crear} disabled={cargando || cargandoCatalogos}><Check size={16} /> {cargando ? 'Guardando...' : 'Guardar curso'}</button>
        </article>
      )}
      {cargando && rows.length === 0 ? <SurfaceSkeleton label="cursos" /> : !cargando && rows.length === 0 ? (
        <EmptyState query={query} />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Código</th><th>Asignatura</th><th>Período</th><th>Sede</th><th>Cupo</th><th>Fechas</th><th>Día y horario</th><th>Aula</th><th>Estado</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((curso) => {
                const asignatura = catalogos.asignaturas.find((item) => item.id === curso.asignaturaId)
                const periodo = catalogos.periodos.find((item) => item.id === curso.periodoId)
                const sede = catalogos.sedes.find((item) => item.id === curso.sedeId)
                const aula = catalogos.aulas.find((item) => item.id === curso.aulaId)
                return <tr key={curso.id}>
                  <td><strong>{curso.codigo}</strong><div className="muted-copy">{nombreModalidad(curso.modalidad)}</div></td>
                  <td>{asignatura ? <><strong>{asignatura.nombre}</strong><div className="muted-copy">{asignatura.codigo}</div></> : 'Asignatura no disponible'}</td>
                  <td>{periodo ? `${periodo.numero}.º cuatrimestre ${periodo.anio}` : 'Período no disponible'}</td>
                  <td>{sede?.nombre ?? curso.sedeNombre ?? 'Sede no disponible'}</td>
                  <td>{curso.cupoMaximo}</td>
                  <td>{fechaBreve(curso.fechaInicio)} – {fechaBreve(curso.fechaFin)}</td>
                  <td>{nombreDia(curso.diaSemana)} · {curso.turno?.toLocaleLowerCase() ?? 'Sin turno'}{curso.horaInicio && curso.horaFin ? ` · ${curso.horaInicio.slice(0, 5)}–${curso.horaFin.slice(0, 5)}` : ''}</td>
                  <td>{aula?.nombre ?? curso.aulaNombre ?? (curso.aulaId ? 'Aula no disponible' : 'Sin aula')}</td>
                  <td>{nombreEstadoCurso(curso.estado)}</td>
                  <td><button className="secondary-button" type="button" onClick={() => abrirDetalle(curso.id)}>Administrar</button></td>
                </tr>
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function DetalleCurso({
  curso,
  catalogos,
  aulas,
  cargandoAulas,
  errorAulas,
  onNotify,
  onRefresh,
}: {
  curso: CursoDetalle
  catalogos: { asignaturas: Asignatura[]; periodos: PeriodoAcademico[]; sedes: Sede[] }
  aulas: AulaCatalogo[]
  cargandoAulas: boolean
  errorAulas: string
  onNotify: (value: string) => void
  onRefresh: () => void
}) {
  const dispatch = useAppDispatch()
  const [estado, setEstado] = useState(curso.estado)
  const [horario, setHorario] = useState({
    aulaId: curso.aulaId ?? 0,
    diaSemana: curso.diaSemana ?? '',
    horaInicio: curso.horaInicio?.slice(0, 5) ?? '',
    horaFin: curso.horaFin?.slice(0, 5) ?? '',
  })
  const [docente, setDocente] = useState(docenteVacio)
  const [inscripcion, setInscripcion] = useState(inscripcionVacia)
  const [resultado, setResultado] = useState(resultadoVacio)
  const asignatura = catalogos.asignaturas.find((item) => item.id === curso.asignaturaId)
  const periodo = catalogos.periodos.find((item) => item.id === curso.periodoId)
  const sede = catalogos.sedes.find((item) => item.id === curso.sedeId)
  const aulasDeSede = aulas.filter((aula) => aula.sedeId === curso.sedeId)
  const aulaActualDisponible = aulasDeSede.some((aula) => aula.id === horario.aulaId)
  const mostrarAulaActualSinVerificar = horario.aulaId > 0 && !aulaActualDisponible
  const aulaActualAusente = !cargandoAulas && mostrarAulaActualSinVerificar

  const guardarEstado = async () => {
    if (!estado.trim()) {
      onNotify('Ingresá el estado del curso.')
      return
    }
    const action = await dispatch(actualizarEstadoCurso({ id: curso.id, estado }))
    if (actualizarEstadoCurso.fulfilled.match(action)) {
      onNotify('Estado del curso actualizado')
      onRefresh()
    }
  }

  const guardarHorario = async () => {
    if (!Number.isInteger(horario.aulaId) || horario.aulaId <= 0 || !horario.diaSemana ||
        !horario.horaInicio || !horario.horaFin || horario.horaInicio >= horario.horaFin) {
      onNotify('Completá un día, aula y rango horario válidos.')
      return
    }
    if (aulaActualAusente && horario.aulaId !== curso.aulaId) {
      onNotify('Seleccioná un aula disponible para esta sede.')
      return
    }
    const action = await dispatch(actualizarHorarioCurso({ id: curso.id, datos: horario }))
    if (actualizarHorarioCurso.fulfilled.match(action)) {
      onNotify('Horario del curso actualizado')
      onRefresh()
    }
  }

  const agregarDocente = async () => {
    if (!docente.docenteId.trim() || !docente.rol.trim()) {
      onNotify('Completá el ID del docente y su rol.')
      return
    }
    const action = await dispatch(asignarDocenteCurso({ id: curso.id, datos: docente }))
    if (asignarDocenteCurso.fulfilled.match(action)) {
      setDocente(docenteVacio)
      onNotify('Docente asignado correctamente')
      onRefresh()
    }
  }

  const inscribir = async () => {
    if (!inscripcion.alumnoId.trim()) {
      onNotify('Completá el ID del alumno.')
      return
    }
    const action = await dispatch(inscribirAlumnoCurso({
      id: curso.id,
      datos: { alumnoId: inscripcion.alumnoId.trim() },
    }))
    if (inscribirAlumnoCurso.fulfilled.match(action)) {
      setInscripcion(inscripcionVacia)
      onNotify('Inscripción registrada correctamente')
      onRefresh()
    }
  }

  const guardarResultado = async () => {
    if (!resultado.alumnoId.trim() || !resultado.estado.trim()) {
      onNotify('Completá el alumno y el estado del resultado.')
      return
    }
    const action = await dispatch(actualizarInscripcionCurso({
      id: curso.id,
      alumnoId: resultado.alumnoId.trim(),
      datos: {
        estado: resultado.estado,
        notaFinal: resultado.notaFinal,
        fechaResultado: resultado.fechaResultado || null,
      },
    }))
    if (actualizarInscripcionCurso.fulfilled.match(action)) {
      setResultado(resultadoVacio)
      onNotify('Resultado actualizado correctamente')
      onRefresh()
    }
  }

  const cargarResultado = (alumnoId: string) => {
    const alumno = curso.inscripciones.find((item) => item.alumnoId === alumnoId)
    if (!alumno) return
    setResultado({
      alumnoId: alumno.alumnoId,
      estado: alumno.estado,
      notaFinal: alumno.notaFinal,
      fechaResultado: alumno.fechaResultado ?? '',
    })
  }

  return (
    <div className="course-detail">
      <article className="panel course-detail__summary">
        <div className="course-detail__summary-heading">
          <div>
            <h2>{curso.codigo}</h2>
            <p>{asignatura ? `${asignatura.codigo} · ${asignatura.nombre}` : 'Asignatura no disponible'} · {periodo ? `${periodo.numero}.º cuatrimestre ${periodo.anio}` : 'Período no disponible'} · {sede?.nombre ?? curso.sedeNombre ?? 'Sede no disponible'}</p>
          </div>
          <div className="course-detail__summary-meta">
            <span>{nombreModalidad(curso.modalidad)}</span>
            <span>Cupo máximo: {curso.cupoMaximo}</span>
          </div>
        </div>
        <div className="course-detail__facts">
          <p>{fechaBreve(curso.fechaInicio)} – {fechaBreve(curso.fechaFin)}</p>
          <p>{nombreDia(curso.diaSemana)} · {curso.turno?.toLocaleLowerCase() ?? 'Sin turno'}{curso.horaInicio && curso.horaFin ? ` · ${curso.horaInicio.slice(0, 5)}–${curso.horaFin.slice(0, 5)}` : ''} · Aula {curso.aulaNombre ?? (curso.aulaId ? 'no disponible' : 'sin asignar')}</p>
        </div>
        <div className="form-grid course-detail__section-form">
          <label>Estado
            <select value={estado} onChange={(event) => setEstado(event.target.value)}>
              {estadosCurso.map((opcion) => <option key={opcion.value} value={opcion.value}>{opcion.label}</option>)}
            </select>
          </label>
        </div>
        <button className="secondary-button" type="button" onClick={guardarEstado} disabled={estado === curso.estado}>Actualizar estado</button>
      </article>
      <article className="panel course-detail__section">
        <h2>Horario y aula</h2>
        <div className="form-grid">
          <label>Día de la semana
            <select value={horario.diaSemana} onChange={(event) => setHorario({ ...horario, diaSemana: event.target.value })}>
              <option value="">Seleccioná un día...</option>
              {diasSemana.map((dia) => <option key={dia.value} value={dia.value}>{dia.label}</option>)}
            </select>
          </label>
          <label>Aula
            <select
              value={horario.aulaId || ''}
              onChange={(event) => setHorario({ ...horario, aulaId: Number(event.target.value) })}
              disabled={cargandoAulas || aulasDeSede.length === 0}
            >
              <option value="">
                {cargandoAulas ? 'Cargando aulas disponibles…' : aulasDeSede.length ? 'Seleccioná un aula…' : 'No hay aulas disponibles para esta sede'}
              </option>
              {mostrarAulaActualSinVerificar && (
                <option value={horario.aulaId} disabled>
                  Aula actual: {curso.aulaNombre ?? `#${horario.aulaId}`} ({cargandoAulas ? 'comprobando disponibilidad…' : 'no disponible'})
                </option>
              )}
              {aulasDeSede.map((aula) => (
                <option key={aula.id} value={aula.id}>{aula.codigo}: {aula.nombre}</option>
              ))}
            </select>
            {aulaActualAusente && <small className="course-detail__field-note course-detail__field-note--warning">El aula actual no figura entre las disponibles; elegí otra para cambiarla.</small>}
          </label>
          <label>Hora de inicio<input type="time" value={horario.horaInicio} onChange={(event) => setHorario({ ...horario, horaInicio: event.target.value })} /></label>
          <label>Hora de fin<input type="time" value={horario.horaFin} onChange={(event) => setHorario({ ...horario, horaFin: event.target.value })} /></label>
        </div>
        {errorAulas && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {errorAulas}</div>}
        <button className="secondary-button" type="button" onClick={guardarHorario} disabled={cargandoAulas}>Guardar horario</button>
      </article>
      <article className="panel course-detail__section">
        <h2>Docentes</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID externo de docente</th><th>Rol</th></tr></thead>
            <tbody>{curso.docentes.map((item) => <tr key={item.id}><td>{item.docenteId}</td><td>{item.rol}</td></tr>)}</tbody>
          </table>
          {curso.docentes.length === 0 && <p className="muted-copy">Todavía no hay docentes asignados.</p>}
        </div>
        <div className="form-grid">
          <label>ID externo del docente<input value={docente.docenteId} onChange={(event) => setDocente({ ...docente, docenteId: event.target.value })} aria-describedby="docente-id-help" /></label>
          <label>Rol
            <select value={docente.rol} onChange={(event) => setDocente({ ...docente, rol: event.target.value })}>
              <option value="">Seleccioná un rol...</option>
              {rolesDocente.map((opcion) => <option key={opcion.value} value={opcion.value}>{opcion.label}</option>)}
            </select>
          </label>
        </div>
        <p className="course-detail__field-note" id="docente-id-help">El backend recibe un identificador externo de docente; todavía no expone un catálogo para elegir por nombre.</p>
        <button className="secondary-button" type="button" onClick={agregarDocente}><Plus size={16} /> Asignar docente</button>
      </article>

      <article className="panel course-detail__section">
        <h2>Inscripciones y resultados</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID externo de alumno</th><th>Fecha</th><th>Estado</th><th>Nota final</th><th>Fecha de resultado</th><th /></tr></thead>
            <tbody>{curso.inscripciones.map((item) => (
              <tr key={item.id}>
                <td>{item.alumnoId}</td><td>{item.fechaInscripcion}</td><td>{item.estado}</td>
                <td>{item.notaFinal ?? '—'}</td><td>{item.fechaResultado ?? '—'}</td>
                <td><button className="text-button" type="button" onClick={() => cargarResultado(item.alumnoId)}>Cargar resultado</button></td>
              </tr>
            ))}</tbody>
          </table>
          {curso.inscripciones.length === 0 && <p className="muted-copy">No hay inscripciones registradas.</p>}
        </div>
        <h3>Inscribir alumno</h3>
        <div className="form-grid">
          <label>ID externo del alumno<input value={inscripcion.alumnoId} onChange={(event) => setInscripcion({ ...inscripcion, alumnoId: event.target.value })} aria-describedby="alumno-id-help" /></label>
        </div>
        <p className="course-detail__field-note" id="alumno-id-help">El backend recibe un identificador externo; todavía no hay un catálogo de estudiantes para seleccionar.</p>
        <button className="secondary-button" type="button" onClick={inscribir}><Plus size={16} /> Inscribir</button>
        <h3>Actualizar resultado</h3>
        <div className="form-grid">
          <label>Alumno inscrito
            <select value={resultado.alumnoId} onChange={(event) => {
              const seleccionado = curso.inscripciones.find((item) => item.alumnoId === event.target.value)
              setResultado(seleccionado ? { alumnoId: seleccionado.alumnoId, estado: seleccionado.estado, notaFinal: seleccionado.notaFinal, fechaResultado: seleccionado.fechaResultado ?? '' } : resultadoVacio)
            }} disabled={curso.inscripciones.length === 0}>
              <option value="">{curso.inscripciones.length ? 'Seleccioná un alumno inscrito...' : 'No hay alumnos inscriptos'}</option>
              {curso.inscripciones.map((item) => <option key={item.id} value={item.alumnoId}>ID externo: {item.alumnoId}</option>)}
            </select>
          </label>
          <label>Estado
            <select value={resultado.estado} onChange={(event) => setResultado({ ...resultado, estado: event.target.value })}>
              <option value="">Seleccioná un estado...</option>
              {estadosInscripcion.map((opcion) => <option key={opcion.value} value={opcion.value}>{opcion.label}</option>)}
            </select>
          </label>
          <label>Nota final<input type="number" inputMode="decimal" min="0" max="10" step="0.01" value={resultado.notaFinal ?? ''} onChange={(event) => setResultado({ ...resultado, notaFinal: event.target.value === '' ? null : Number(event.target.value) })} /></label>
          <CalendarDatePicker label="Fecha de resultado" value={resultado.fechaResultado ?? ''} onChange={(fechaResultado) => setResultado({ ...resultado, fechaResultado })} />
        </div>
        <button className="secondary-button" type="button" onClick={guardarResultado} disabled={!resultado.alumnoId}>Guardar resultado</button>
      </article>

    </div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="form-error summary" role="alert"><WarningCircle size={15} /> {message}</div>
}
