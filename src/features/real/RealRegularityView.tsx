import { Check, CheckCircle, ClipboardText, Student, WarningCircle } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { AcademicSelect, type AcademicSelectOption } from '../../components/ui/AcademicSelect'
import { SurfaceSkeleton } from '../../components/ui/SurfaceSkeleton'
import { extraerMensajeError } from '../../services/api/erroresApi'
import { catalogosService } from '../../services/catalogos/catalogosService'
import { cursosService } from '../../services/cursos/cursosService'
import { limpiarResultadoRegularidad, validarRegularidad } from '../../services/regularidad/regularidadSlice'
import type { Asignatura, Curso, CursoDetalle } from '../../types/api'
import './RealRegularityView.css'

export function RealRegularityView({ onNotify }: { onNotify: (value: string) => void }) {
  const dispatch = useAppDispatch()
  const { resultado, cargando, error } = useAppSelector((state) => state.regularidad)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([])
  const [cursoDetalle, setCursoDetalle] = useState<CursoDetalle | null>(null)
  const [cursoId, setCursoId] = useState('')
  const [alumnoId, setAlumnoId] = useState('')
  const [asistencia, setAsistencia] = useState('80')
  const [promedio, setPromedio] = useState('7')
  const [asistenciaMinima, setAsistenciaMinima] = useState('75')
  const [promedioMinimo, setPromedioMinimo] = useState('6')
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true)
  const [cargandoInscripciones, setCargandoInscripciones] = useState(false)
  const [errorCatalogos, setErrorCatalogos] = useState('')
  const [errorInscripciones, setErrorInscripciones] = useState('')

  useEffect(() => {
    let activo = true
    Promise.all([cursosService.listar(), catalogosService.listarAsignaturas()])
      .then(([cursosDisponibles, asignaturasDisponibles]) => {
        if (!activo) return
        setCursos(cursosDisponibles)
        setAsignaturas(asignaturasDisponibles)
      })
      .catch((catalogosError) => {
        if (activo) setErrorCatalogos(extraerMensajeError(catalogosError, 'No se pudieron cargar los cursos y materias'))
      })
      .finally(() => {
        if (activo) setCargandoCatalogos(false)
      })
    return () => { activo = false }
  }, [])

  useEffect(() => {
    if (!cursoId) return
    let activo = true
    cursosService.obtener(Number(cursoId))
      .then((detalle) => {
        if (activo) setCursoDetalle(detalle)
      })
      .catch((detalleError) => {
        if (activo) {
          setCursoDetalle(null)
          setErrorInscripciones(extraerMensajeError(detalleError, 'No se pudieron cargar los alumnos del curso'))
        }
      })
      .finally(() => {
        if (activo) setCargandoInscripciones(false)
      })
    return () => { activo = false }
  }, [cursoId])

  useEffect(() => () => { dispatch(limpiarResultadoRegularidad()) }, [dispatch])

  const asignaturasPorId = useMemo(
    () => new Map(asignaturas.map((asignatura) => [asignatura.id, asignatura])),
    [asignaturas],
  )
  const opcionesCurso: AcademicSelectOption[] = cursos.map((curso) => {
    const asignatura = asignaturasPorId.get(curso.asignaturaId)
    return {
      value: String(curso.id),
      code: curso.codigo,
      label: asignatura?.nombre ?? `Materia #${curso.asignaturaId}`,
      description: asignatura ? `${asignatura.codigo} · ${curso.sedeNombre}` : curso.sedeNombre,
      meta: curso.estado,
    }
  })
  const inscripcionesActivas = cursoDetalle?.inscripciones.filter((item) => item.estado !== 'BAJA') ?? []
  const opcionesAlumno: AcademicSelectOption[] = inscripcionesActivas.map((inscripcion) => ({
    value: inscripcion.alumnoId,
    code: inscripcion.alumnoId,
    label: `Alumno ${inscripcion.alumnoId}`,
    description: `Estado en el curso: ${inscripcion.estado}`,
  }))

  const limpiarResultado = () => dispatch(limpiarResultadoRegularidad())
  const seleccionarCurso = (value: string) => {
    setCursoId(value)
    setAlumnoId('')
    setCursoDetalle(null)
    setErrorInscripciones('')
    setCargandoInscripciones(Boolean(value))
    limpiarResultado()
  }
  const cambiarNumero = (setter: (value: string) => void, value: string) => {
    setter(value)
    limpiarResultado()
  }

  const validar = async () => {
    if (!cursoId || !alumnoId) {
      onNotify('Seleccioná un curso y un alumno inscripto.')
      return
    }
    const numeros = [asistencia, promedio, asistenciaMinima, promedioMinimo].map(Number)
    if (numeros.some((valor) => !Number.isFinite(valor))) {
      onNotify('Completá todos los valores de regularidad.')
      return
    }
    const resultadoAccion = await dispatch(validarRegularidad({
      alumnoId,
      cursoId: Number(cursoId),
      asistencia: numeros[0],
      promedio: numeros[1],
      asistenciaMinima: numeros[2],
      promedioMinimo: numeros[3],
    }))
    if (validarRegularidad.fulfilled.match(resultadoAccion)) onNotify('Validación completada')
  }

  const tonoResultado = resultado
    ? resultado.habilitadoParaFinal ? 'approved' : resultado.regular ? 'conditional' : 'rejected'
    : ''
  const tituloResultado = resultado
    ? resultado.habilitadoParaFinal
      ? 'Habilitado para rendir'
      : resultado.regular
        ? 'Regular, con correlativas pendientes'
        : 'No alcanza la regularidad'
    : 'Esperando validación'

  return <div className="regularity-layout">
    <article className="panel validation-card">
      <div className="form-kicker">MOTOR DE VALIDACIÓN</div>
      <h2>¿Puede rendir el final?</h2>
      <p>Elegí el curso y el alumno. Se comprobarán su inscripción, la materia y las correlativas aprobadas.</p>
      {errorCatalogos && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {errorCatalogos}</div>}
      {errorInscripciones && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {errorInscripciones}</div>}
      {error && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {error}</div>}
      {cargandoCatalogos ? <SurfaceSkeleton label="cursos y materias" rows={2} /> : (
        <div className="regularity-context-fields">
          <AcademicSelect label="Curso y materia" value={cursoId} options={opcionesCurso} onChange={seleccionarCurso} placeholder="Seleccioná un curso" searchPlaceholder="Buscar por curso o materia..." emptyMessage="No hay cursos disponibles." clearable />
          <AcademicSelect label="Alumno inscripto" value={alumnoId} options={opcionesAlumno} onChange={(value) => { setAlumnoId(value); limpiarResultado() }} placeholder="Seleccioná un alumno" searchPlaceholder="Buscar por ID de alumno..." emptyMessage={cursoId ? 'El curso no tiene alumnos inscriptos activos.' : 'Primero seleccioná un curso.'} loading={cargandoInscripciones} disabled={!cursoId || cargandoInscripciones} clearable />
        </div>
      )}
      <div className="form-grid">
        <label>Asistencia registrada (%)<input value={asistencia} onChange={(e) => cambiarNumero(setAsistencia, e.target.value)} type="number" min="0" max="100" /></label>
        <label>Promedio de cursada<input value={promedio} onChange={(e) => cambiarNumero(setPromedio, e.target.value)} type="number" min="0" max="10" step=".1" /></label>
        <label>Asistencia mínima exigida (%)<input value={asistenciaMinima} onChange={(e) => cambiarNumero(setAsistenciaMinima, e.target.value)} type="number" min="0" max="100" /></label>
        <label>Promedio mínimo exigido<input value={promedioMinimo} onChange={(e) => cambiarNumero(setPromedioMinimo, e.target.value)} type="number" min="0" max="10" step=".1" /></label>
      </div>
      <button className="primary-button" onClick={validar} disabled={cargando || cargandoCatalogos || cargandoInscripciones}><Check size={17} /> {cargando ? 'Validando...' : 'Validar regularidad'}</button>
    </article>
    <article className={`panel result-card ${tonoResultado}`} aria-live="polite">
      <div className="result-icon">{resultado ? (resultado.habilitadoParaFinal ? <CheckCircle size={28} weight="fill" /> : <WarningCircle size={28} weight="fill" />) : <ClipboardText size={28} />}</div>
      <span className="result-label">RESULTADO</span>
      <h2>{tituloResultado}</h2>
      {resultado ? <>
        <div className="regularity-result-context">
          <Student size={18} aria-hidden="true" />
          <span><strong>{resultado.alumnoId}</strong><small>{resultado.cursoCodigo} · {resultado.asignaturaCodigo} · {resultado.asignaturaNombre}</small></span>
        </div>
        {resultado.motivos.length > 0
          ? <ul>{resultado.motivos.map((motivo) => <li key={motivo}>{motivo}</li>)}</ul>
          : <p>Cumple la asistencia, el promedio y todas las correlativas requeridas.</p>}
      </> : <p>El resultado aparecerá después de elegir un curso, un alumno y completar los datos.</p>}
    </article>
  </div>
}
