import { ArrowLeft, Check, Plus, WarningCircle } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { CalendarDatePicker } from '../../components/ui/CalendarDatePicker'
import { EmptyState } from '../../components/ui/EmptyState'
import { extraerMensajeError } from '../../services/api/erroresApi'
import { catalogosService, type AulaCatalogo } from '../../services/catalogos/catalogosService'
import {
  asignarDocenteCurso,
  actualizarEstadoCurso,
  actualizarHorarioCurso,
  crearCurso,
  guardarInscripcionCurso,
  limpiarCursoSeleccionado,
  listarCursos,
  obtenerCurso,
} from '../../services/cursos/cursosSlice'
import type { Asignatura, CursoDetalle, CrearCurso, GuardarInscripcionCurso, PeriodoAcademico, Sede } from '../../types/api'
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
  estado: '',
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
const inscripcionVacia = { alumnoId: '', fechaInscripcion: '', estado: '' }

export function CursosPanel({ query, onNotify }: { query: string; onNotify: (value: string) => void }) {
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
        }
      })
      .catch((error) => {
        if (activo) setErrorCatalogos(extraerMensajeError(error, 'No se pudieron cargar los datos para crear cursos'))
      })
      .finally(() => {
        if (activo) setCargandoCatalogos(false)
      })
    return () => { activo = false }
  }, [])

  const rows = items.filter((curso) =>
    `${curso.codigo} ${curso.asignaturaId} ${curso.periodoId} ${curso.sedeId} ${curso.sedeNombre ?? ''} ${curso.aulaNombre ?? ''}`.toLowerCase().includes(query.toLowerCase()),
  )

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
      !valores.estado.trim() ||
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
        {cargandoDetalle && <p className="muted-copy">Consultando curso...</p>}
        {curso && <DetalleCurso curso={curso} onNotify={onNotify} onRefresh={() => dispatch(obtenerCurso(curso.id))} />}
      </section>
    )
  }

  return (
    <>
      <div className="list-meta">
        <span>Filtrá por período o buscá por código e IDs asociados</span>
        <button className="text-button" type="button" onClick={() => setFormAbierto((abierto) => !abierto)}>
          {formAbierto ? 'Cancelar' : '+ Crear curso'}
        </button>
      </div>
      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="form-grid" style={{ alignItems: 'end' }}>
          <label>
            ID de período
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
          <button className="secondary-button" type="button" onClick={aplicarFiltroPeriodo} style={{ height: 42, paddingBlock: 0 }}>
            Aplicar filtro
          </button>
        </div>
      </div>
      {error && <ErrorMessage message={error} />}
      {errorCatalogos && <ErrorMessage message={errorCatalogos} />}
      {formAbierto && (
        <article className="panel" style={{ marginBottom: 18 }}>
          <h2>Nuevo curso</h2>
          <p className="muted-copy">Elegí los registros relacionados; el sistema enviará sus IDs al backend.</p>
          {cargandoCatalogos && <p className="muted-copy">Cargando asignaturas, períodos, sedes y aulas...</p>}
          <div className="form-grid">
            <label>
              Código
              <input value={valores.codigo} onChange={(event) => setValores({ ...valores, codigo: normalizarCodigoAcademico(event.target.value) })} placeholder="Ej. ARQ1-001" pattern="[A-Z]{3}[0-9]?-[0-9]{3}" title={CODIGO_ACADEMICO_MENSAJE} />
              <small>Formato: ARQ-001 o ARQ1-001</small>
            </label>
            <label>
              Asignatura
              <select value={valores.asignaturaId || ''} onChange={(event) => setValores({ ...valores, asignaturaId: Number(event.target.value) })}>
                <option value="">{catalogos.asignaturas.length ? 'Seleccioná una asignatura...' : 'No hay asignaturas disponibles'}</option>
                {catalogos.asignaturas.map((asignatura) => <option key={asignatura.id} value={asignatura.id}>{asignatura.codigo}: {asignatura.nombre}</option>)}
              </select>
            </label>
            <label>
              Período
              <select value={valores.periodoId || ''} onChange={(event) => setValores({ ...valores, periodoId: Number(event.target.value) })}>
                <option value="">{catalogos.periodos.length ? 'Seleccioná un período...' : 'No hay períodos disponibles'}</option>
                {catalogos.periodos.map((periodo) => <option key={periodo.id} value={periodo.id}>{periodo.anio}-{periodo.numero} - {periodo.numero}° cuatrimestre</option>)}
              </select>
            </label>
            <label>
              Sede
              <select value={valores.sedeId || ''} onChange={(event) => setValores({ ...valores, sedeId: Number(event.target.value), aulaId: 0 })}>
                <option value="">{catalogos.sedes.length ? 'Seleccioná una sede...' : 'No hay sedes disponibles'}</option>
                {catalogos.sedes.map((sede) => <option key={sede.id} value={sede.id}>{sede.nombre} - {sede.direccion}</option>)}
              </select>
            </label>
            <label>
              Modalidad
              <input value={valores.modalidad} onChange={(event) => setValores({ ...valores, modalidad: event.target.value })} placeholder="Ej. PRESENCIAL" />
            </label>
            <label>
              Estado
              <input value={valores.estado} onChange={(event) => setValores({ ...valores, estado: event.target.value })} placeholder="Estado inicial" />
            </label>
            <label>
              Cupo máximo
              <input type="number" min="1" step="1" value={valores.cupoMaximo || ''} onChange={(event) => setValores({ ...valores, cupoMaximo: Number(event.target.value) })} />
            </label>
            <CalendarDatePicker label="Fecha de inicio" value={valores.fechaInicio} onChange={(fechaInicio) => setValores({ ...valores, fechaInicio })} />
            <CalendarDatePicker label="Fecha de fin" value={valores.fechaFin} onChange={(fechaFin) => setValores({ ...valores, fechaFin })} />
          </div>
          <div className="form-grid">
            <label>Turno
              <select value={valores.turno} onChange={(event) => setValores({ ...valores, turno: event.target.value as CrearCurso['turno'] })}>
                <option value="">Seleccioná un turno...</option>
                <option value="MAÑANA">MAÑANA</option>
                <option value="TARDE">TARDE</option>
                <option value="NOCHE">NOCHE</option>
              </select>
            </label>
            <label>Día de la semana
              <select value={valores.diaSemana} onChange={(event) => setValores({ ...valores, diaSemana: event.target.value })}>
                <option value="">Seleccioná un día...</option>
                {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map((dia, index) => (
                  <option key={dia} value={dia}>{['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][index]}</option>
                ))}
              </select>
            </label>
            <label>Aula
              <select value={valores.aulaId || ''} onChange={(event) => setValores({ ...valores, aulaId: Number(event.target.value) })} disabled={!valores.sedeId}>
                <option value="">{!valores.sedeId ? 'Primero seleccioná una sede...' : aulasDeSede.length ? 'Seleccioná un aula...' : 'No hay aulas para esta sede'}</option>
                {aulasDeSede.map((aula) => <option key={aula.id} value={aula.id}>{aula.codigo}: {aula.nombre}</option>)}
              </select>
            </label>
            <label>Hora de inicio
              <input type="time" value={valores.horaInicio} onChange={(event) => setValores({ ...valores, horaInicio: event.target.value })} />
            </label>
            <label>Hora de fin
              <input type="time" value={valores.horaFin} onChange={(event) => setValores({ ...valores, horaFin: event.target.value })} />
            </label>
          </div>
          <button className="primary-button" type="button" onClick={crear}><Check size={16} /> Guardar curso</button>
        </article>
      )}
      {cargando && <p className="muted-copy">Cargando cursos...</p>}
      {!cargando && rows.length === 0 ? (
        <EmptyState query={query} />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Código</th><th>Asignatura</th><th>Período</th><th>Sede</th><th>Cupo</th><th>Fechas</th><th>Día y horario</th><th>Aula</th><th>Estado</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((curso) => (
                <tr key={curso.id}>
                  <td><strong>{curso.codigo}</strong><div className="muted-copy">#{curso.id} · {curso.modalidad}</div></td>
                  <td>#{curso.asignaturaId}</td>
                  <td>#{curso.periodoId}</td>
                  <td>{curso.sedeNombre ?? `#${curso.sedeId}`}</td>
                  <td>{curso.cupoMaximo}</td>
                  <td>{curso.fechaInicio} – {curso.fechaFin}</td>
                  <td>{curso.diaSemana ?? 'Sin día'} · {curso.turno ?? 'Sin turno'}{curso.horaInicio && curso.horaFin ? ` · ${curso.horaInicio.slice(0, 5)}–${curso.horaFin.slice(0, 5)}` : ''}</td>
                  <td>{curso.aulaNombre ?? (curso.aulaId ? `#${curso.aulaId}` : 'Sin aula')}</td>
                  <td>{curso.estado}</td>
                  <td><button className="secondary-button" type="button" onClick={() => abrirDetalle(curso.id)}>Administrar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function DetalleCurso({
  curso,
  onNotify,
  onRefresh,
}: {
  curso: CursoDetalle
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
  const [resultado, setResultado] = useState<GuardarInscripcionCurso>({
    alumnoId: '',
    fechaInscripcion: '',
    estado: '',
    notaFinal: null,
    fechaResultado: '',
  })

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
    if (!inscripcion.alumnoId.trim() || !inscripcion.fechaInscripcion || !inscripcion.estado.trim()) {
      onNotify('Completá el alumno, la fecha de inscripción y el estado.')
      return
    }
    const action = await dispatch(guardarInscripcionCurso({
      id: curso.id,
      datos: inscripcion,
      actualizar: false,
    }))
    if (guardarInscripcionCurso.fulfilled.match(action)) {
      setInscripcion(inscripcionVacia)
      onNotify('Inscripción registrada correctamente')
      onRefresh()
    }
  }

  const guardarResultado = async () => {
    if (!resultado.alumnoId.trim() || !resultado.fechaInscripcion || !resultado.estado.trim()) {
      onNotify('Completá los datos obligatorios de la inscripción.')
      return
    }
    const action = await dispatch(guardarInscripcionCurso({
      id: curso.id,
      datos: resultado,
      actualizar: true,
    }))
    if (guardarInscripcionCurso.fulfilled.match(action)) {
      onNotify('Resultado actualizado correctamente')
      onRefresh()
    }
  }

  const cargarResultado = (alumnoId: string) => {
    const alumno = curso.inscripciones.find((item) => item.alumnoId === alumnoId)
    if (!alumno) return
    setResultado({
      alumnoId: alumno.alumnoId,
      fechaInscripcion: alumno.fechaInscripcion,
      estado: alumno.estado,
      notaFinal: alumno.notaFinal,
      fechaResultado: alumno.fechaResultado ?? '',
    })
  }

  return (
    <div style={{ marginTop: 18 }}>
      <article className="panel">
        <div className="list-meta">
          <div><h2>{curso.codigo}</h2><span>Curso #{curso.id} · Asignatura #{curso.asignaturaId} · Período #{curso.periodoId} · {curso.sedeNombre ?? `Sede #${curso.sedeId}`}</span></div>
          <span>{curso.modalidad} · Cupo {curso.cupoMaximo}</span>
        </div>
        <p className="muted-copy">{curso.fechaInicio} – {curso.fechaFin}</p>
        <p className="muted-copy">{curso.diaSemana ?? 'Sin día'} · {curso.turno ?? 'Sin turno'}{curso.horaInicio && curso.horaFin ? ` · ${curso.horaInicio.slice(0, 5)}–${curso.horaFin.slice(0, 5)}` : ''} · Aula {curso.aulaNombre ?? (curso.aulaId ? `#${curso.aulaId}` : 'sin asignar')}</p>
        <div className="form-grid">
          <label>Estado<input value={estado} onChange={(event) => setEstado(event.target.value)} /></label>
        </div>
        <button className="secondary-button" type="button" onClick={guardarEstado}>Actualizar estado</button>
      </article>
      <article className="panel" style={{ marginTop: 18 }}>
        <h2>Horario y aula</h2>
        <div className="form-grid">
          <label>Día de la semana
            <select value={horario.diaSemana} onChange={(event) => setHorario({ ...horario, diaSemana: event.target.value })}>
              <option value="">Seleccioná un día...</option>
              {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map((dia, index) => (
                <option key={dia} value={dia}>{['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][index]}</option>
              ))}
            </select>
          </label>
          <label>ID de aula<input type="number" min="1" value={horario.aulaId || ''} onChange={(event) => setHorario({ ...horario, aulaId: Number(event.target.value) })} /></label>
          <label>Hora de inicio<input type="time" value={horario.horaInicio} onChange={(event) => setHorario({ ...horario, horaInicio: event.target.value })} /></label>
          <label>Hora de fin<input type="time" value={horario.horaFin} onChange={(event) => setHorario({ ...horario, horaFin: event.target.value })} /></label>
        </div>
        <button className="secondary-button" type="button" onClick={guardarHorario}>Guardar horario</button>
      </article>
      <article className="panel" style={{ marginTop: 18 }}>
        <h2>Docentes</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Docente</th><th>Rol</th></tr></thead>
            <tbody>{curso.docentes.map((item) => <tr key={item.id}><td>{item.docenteId}</td><td>{item.rol}</td></tr>)}</tbody>
          </table>
          {curso.docentes.length === 0 && <p className="muted-copy">Todavía no hay docentes asignados.</p>}
        </div>
        <div className="form-grid">
          <label>ID externo del docente<input value={docente.docenteId} onChange={(event) => setDocente({ ...docente, docenteId: event.target.value })} /></label>
          <label>Rol<input value={docente.rol} onChange={(event) => setDocente({ ...docente, rol: event.target.value })} placeholder="Ej. TITULAR" /></label>
        </div>
        <button className="secondary-button" type="button" onClick={agregarDocente}><Plus size={16} /> Asignar docente</button>
      </article>

      <article className="panel" style={{ marginTop: 18 }}>
        <h2>Inscripciones y resultados</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Alumno</th><th>Fecha</th><th>Estado</th><th>Nota final</th><th>Fecha de resultado</th><th /></tr></thead>
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
          <label>ID externo del alumno<input value={inscripcion.alumnoId} onChange={(event) => setInscripcion({ ...inscripcion, alumnoId: event.target.value })} /></label>
          <CalendarDatePicker label="Fecha de inscripción" value={inscripcion.fechaInscripcion} onChange={(fechaInscripcion) => setInscripcion({ ...inscripcion, fechaInscripcion })} />
          <label>Estado<input value={inscripcion.estado} onChange={(event) => setInscripcion({ ...inscripcion, estado: event.target.value })} placeholder="Ej. INSCRIPTA" /></label>
        </div>
        <button className="secondary-button" type="button" onClick={inscribir}><Plus size={16} /> Inscribir</button>
        <h3>Actualizar resultado</h3>
        <div className="form-grid">
          <label>ID externo del alumno<input value={resultado.alumnoId} onChange={(event) => setResultado({ ...resultado, alumnoId: event.target.value })} /></label>
          <CalendarDatePicker label="Fecha de inscripción" value={resultado.fechaInscripcion} onChange={(fechaInscripcion) => setResultado({ ...resultado, fechaInscripcion })} />
          <label>Estado<input value={resultado.estado} onChange={(event) => setResultado({ ...resultado, estado: event.target.value })} placeholder="Ej. APROBADA" /></label>
          <label>Nota final<input type="number" step="0.01" value={resultado.notaFinal ?? ''} onChange={(event) => setResultado({ ...resultado, notaFinal: event.target.value === '' ? null : Number(event.target.value) })} /></label>
          <CalendarDatePicker label="Fecha de resultado" value={resultado.fechaResultado ?? ''} onChange={(fechaResultado) => setResultado({ ...resultado, fechaResultado })} />
        </div>
        <button className="secondary-button" type="button" onClick={guardarResultado}>Guardar resultado</button>
      </article>

    </div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="form-error summary" role="alert"><WarningCircle size={15} /> {message}</div>
}
