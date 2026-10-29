import { BookOpenText, CheckCircle, ClipboardText, WarningCircle } from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { AcademicSelect, type AcademicSelectOption } from '../../components/ui/AcademicSelect'
import { SurfaceSkeleton } from '../../components/ui/SurfaceSkeleton'
import { extraerMensajeError } from '../../services/api/erroresApi'
import { catalogosService } from '../../services/catalogos/catalogosService'
import { correlatividadesService } from '../../services/correlatividades/correlatividadesService'
import { cursosService } from '../../services/cursos/cursosService'
import { consultarRegularidad, limpiarResultadoRegularidad } from '../../services/regularidad/regularidadSlice'
import type { Asignatura, CondicionCorrelatividad, Curso } from '../../types/api'
import './RealRegularityView.css'

export function RealRegularityView({ onNotify }: { onNotify: (value: string) => void }) {
  const dispatch = useAppDispatch()
  const { resultado, cargando, error } = useAppSelector((state) => state.regularidad)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([])
  const [cursoId, setCursoId] = useState('')
  const [correlativas, setCorrelativas] = useState<CondicionCorrelatividad[]>([])
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true)
  const [cargandoCorrelativas, setCargandoCorrelativas] = useState(false)
  const [errorCatalogos, setErrorCatalogos] = useState('')
  const [errorCorrelativas, setErrorCorrelativas] = useState('')
  const solicitudCorrelativas = useRef(0)

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

  useEffect(() => () => { dispatch(limpiarResultadoRegularidad()) }, [dispatch])

  const asignaturasPorId = useMemo(
    () => new Map(asignaturas.map((asignatura) => [asignatura.id, asignatura])),
    [asignaturas],
  )
  const cursosPorId = useMemo(() => new Map(cursos.map((curso) => [curso.id, curso])), [cursos])
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

  const seleccionarCurso = async (value: string) => {
    const solicitudActual = ++solicitudCorrelativas.current
    setCursoId(value)
    setCorrelativas([])
    setErrorCorrelativas('')
    setCargandoCorrelativas(Boolean(value))
    dispatch(limpiarResultadoRegularidad())
    if (!value) return

    const curso = cursosPorId.get(Number(value))
    if (!curso) {
      setCargandoCorrelativas(false)
      onNotify('El curso seleccionado ya no está disponible.')
      return
    }

    const consulta = dispatch(consultarRegularidad(curso.id))
    try {
      const respuesta = await correlatividadesService.listar(curso.asignaturaId)
      if (solicitudCorrelativas.current === solicitudActual) setCorrelativas(respuesta.condiciones)
    } catch (correlativasError) {
      if (solicitudCorrelativas.current === solicitudActual) {
        setErrorCorrelativas(extraerMensajeError(correlativasError, 'No se pudieron cargar las correlativas'))
      }
    } finally {
      if (solicitudCorrelativas.current === solicitudActual) setCargandoCorrelativas(false)
    }
    await consulta
  }

  const cursoSeleccionado = cursosPorId.get(Number(cursoId))
  const asignaturaSeleccionada = cursoSeleccionado
    ? asignaturasPorId.get(cursoSeleccionado.asignaturaId)
    : undefined
  const cargandoCondiciones = cargando || cargandoCorrelativas

  return <div className="regularity-layout">
    <article className="panel validation-card">
      <h2>¿Qué exige el curso para regularizar?</h2>
      <p>Elegí un curso para consultar sus condiciones. No se solicitan datos de alumnos ni se evalúan inscripciones individuales.</p>
      {errorCatalogos && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {errorCatalogos}</div>}
      {error && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {error}</div>}
      {errorCorrelativas && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {errorCorrelativas}</div>}
      {cargandoCatalogos ? <SurfaceSkeleton label="cursos y materias" rows={2} /> : (
        <div className="regularity-context-fields regularity-context-fields--single">
          <AcademicSelect
            label="Curso y materia"
            value={cursoId}
            options={opcionesCurso}
            onChange={seleccionarCurso}
            placeholder="Seleccioná un curso"
            searchPlaceholder="Buscar por curso o materia..."
            emptyMessage="No hay cursos disponibles."
            clearable
          />
        </div>
      )}
      <div className="regularity-help">
        <BookOpenText size={20} aria-hidden="true" />
        <span><strong>Fuente de información</strong><small>Los mínimos se guardan por curso. Las correlativas se leen de la configuración de la asignatura.</small></span>
      </div>
    </article>

    <article className={`panel result-card ${resultado ? 'approved' : ''}`} aria-live="polite" aria-busy={cargandoCondiciones}>
      <div className="result-icon">{resultado ? <CheckCircle size={28} weight="fill" /> : <ClipboardText size={28} />}</div>
      <h2>{resultado ? resultado.codigo : cursoId ? 'Cargando condiciones…' : 'Seleccioná un curso'}</h2>
      {cargandoCondiciones && <SurfaceSkeleton label="las condiciones de regularidad" rows={2} />}
      {!cargandoCondiciones && resultado && <>
        <p className="regularity-course-name">
          {asignaturaSeleccionada ? `${asignaturaSeleccionada.codigo} · ${asignaturaSeleccionada.nombre}` : 'Asignatura no disponible'}
        </p>
        <dl className="regularity-thresholds">
          <div><dt>Asistencia mínima</dt><dd>{resultado.asistenciaMinima}%</dd></div>
          <div><dt>Promedio mínimo</dt><dd>{resultado.promedioMinimo}</dd></div>
        </dl>
        <div className="regularity-correlatives">
          <h3>Correlativas requeridas</h3>
          {correlativas.length === 0 ? <p>La asignatura no tiene correlativas configuradas.</p> : correlativas.map((grupo) => (
            <div key={grupo.tipo}>
              <strong>{grupo.tipo === 'APROBADA' ? 'Aprobadas' : 'Regularizadas'}</strong>
              <ul>{grupo.materiasCorrelativas.map((materia) => <li key={materia.id}>{materia.codigo} · {materia.nombre}</li>)}</ul>
            </div>
          ))}
        </div>
      </>}
      {!cargandoCondiciones && !resultado && !cursoId && <p>Las condiciones aparecerán al elegir un curso.</p>}
    </article>
  </div>
}
