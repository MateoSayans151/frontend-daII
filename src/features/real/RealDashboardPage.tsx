import {
  ArrowClockwise,
  ArrowRight,
  Buildings,
  CalendarBlank,
  GraduationCap,
  MapPin,
  Plus,
  WarningCircle,
} from '@phosphor-icons/react'
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { listarCarreras } from '../../services/carreras/carrerasSlice'
import { listarSedes } from '../../services/sedes/sedesSlice'
import { listarPeriodos } from '../../services/periodos/periodosSlice'
import type { Carrera } from '../../types/api'
import type { Screen } from '../../types/domain'
import './RealDashboardPage.css'

type RealDashboardPageProps = {
  onNavigate: (screen: Screen) => void
  onCreate: () => void
}

function estadoCarrera(estado: Carrera['estado']) {
  switch (estado) {
    case 'ACTIVA':
      return { label: 'Activa', className: 'active' }
    case 'BORRADOR':
      return { label: 'Borrador', className: 'draft' }
    case 'INACTIVA':
      return { label: 'Inactiva', className: 'inactive' }
  }
}

function fechaLegible(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return value

  const date = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

function LoadingRows({ label, count = 3 }: { label: string; count?: number }) {
  return (
    <div className="dashboard-loading" role="status" aria-label={`Cargando ${label}`}>
      <span>{`Cargando ${label}…`}</span>
      <div className="dashboard-loading-rows" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => <i key={index} />)}
      </div>
    </div>
  )
}

function EmptyResource({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="dashboard-empty">
      <span className="dashboard-empty-icon" aria-hidden="true"><GraduationCap size={20} /></span>
      <strong>{title}</strong>
      <p>{description}</p>
      <button type="button" className="dashboard-inline-action" onClick={onAction}>
        {actionLabel}<ArrowRight size={15} aria-hidden="true" />
      </button>
    </div>
  )
}

export function RealDashboardPage({ onNavigate, onCreate }: RealDashboardPageProps) {
  const dispatch = useAppDispatch()
  const carreras = useAppSelector((state) => state.carreras)
  const sedes = useAppSelector((state) => state.sedes)
  const periodos = useAppSelector((state) => state.periodos)
  useEffect(() => {
    dispatch(listarCarreras())
    dispatch(listarSedes())
    dispatch(listarPeriodos())
  }, [dispatch])

  const carrerasActivas = carreras.items.filter((carrera) => carrera.estado === 'ACTIVA').length
  const errores = [
    carreras.error && { nombre: 'Carreras', mensaje: carreras.error },
    sedes.error && { nombre: 'Sedes', mensaje: sedes.error },
    periodos.error && { nombre: 'Períodos', mensaje: periodos.error },
  ].filter((error): error is { nombre: string; mensaje: string } => Boolean(error))

  const reintentarErrores = () => {
    if (carreras.error) void dispatch(listarCarreras())
    if (sedes.error) void dispatch(listarSedes())
    if (periodos.error) void dispatch(listarPeriodos())
  }

  const cargandoCarreras = carreras.cargando && carreras.items.length === 0
  const cargandoSedes = sedes.cargando && sedes.items.length === 0
  const cargandoPeriodos = periodos.cargando && periodos.items.length === 0

  return (
    <div className="real-dashboard">
      {errores.length > 0 && (
        <section className="dashboard-alert" role="alert" aria-labelledby="dashboard-alert-title">
          <WarningCircle size={21} weight="fill" aria-hidden="true" />
          <div className="dashboard-alert-copy">
            <strong id="dashboard-alert-title">Algunas secciones no pudieron actualizarse</strong>
            <p>El resto de la información sigue disponible. Revisá el detalle e intentá nuevamente.</p>
            <ul>
              {errores.map((error) => <li key={error.nombre}><strong>{error.nombre}:</strong> {error.mensaje}</li>)}
            </ul>
          </div>
          <button type="button" className="dashboard-retry" onClick={reintentarErrores}>
            <ArrowClockwise size={16} aria-hidden="true" />
            Reintentar
          </button>
        </section>
      )}

      <section className="dashboard-section" aria-labelledby="dashboard-summary-title">
        <div className="dashboard-section-heading">
          <div>
            <h2 id="dashboard-summary-title">Resumen de la gestión</h2>
            <p>Indicadores y registros de la estructura académica.</p>
          </div>
          <span className="dashboard-data-source"><span aria-hidden="true" />Información del sistema</span>
        </div>

        <div className="dashboard-metrics">
          <button
            type="button"
            className="dashboard-metric careers-metric"
            onClick={() => onNavigate('Carreras')}
            aria-label={cargandoCarreras ? 'Cargando carreras' : `Ver carreras: ${carrerasActivas} activas de ${carreras.items.length} registradas`}
            aria-busy={cargandoCarreras}
          >
            <span className="dashboard-metric-icon"><GraduationCap size={20} aria-hidden="true" /></span>
            <span className="dashboard-metric-content">
              <span className="dashboard-metric-label">Carreras activas</span>
              <strong>{cargandoCarreras ? <i className="dashboard-skeleton metric-skeleton" aria-hidden="true" /> : carrerasActivas}</strong>
              <span className="dashboard-metric-detail">
                {cargandoCarreras ? 'Consultando registros' : `${carreras.items.length} ${carreras.items.length === 1 ? 'carrera registrada' : 'carreras registradas'}`}
              </span>
            </span>
            <ArrowRight className="dashboard-metric-arrow" size={17} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="dashboard-metric campuses-metric"
            onClick={() => onNavigate('Sedes y aulas')}
            aria-label={cargandoSedes ? 'Cargando sedes' : `Ver ${sedes.items.length} sedes registradas`}
            aria-busy={cargandoSedes}
          >
            <span className="dashboard-metric-icon"><Buildings size={20} aria-hidden="true" /></span>
            <span className="dashboard-metric-content">
              <span className="dashboard-metric-label">Sedes</span>
              <strong>{cargandoSedes ? <i className="dashboard-skeleton metric-skeleton" aria-hidden="true" /> : sedes.items.length}</strong>
              <span className="dashboard-metric-detail">Espacios por sede</span>
            </span>
            <ArrowRight className="dashboard-metric-arrow" size={17} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="dashboard-metric periods-metric"
            onClick={() => onNavigate('Períodos')}
            aria-label={cargandoPeriodos ? 'Cargando períodos académicos' : `Ver ${periodos.items.length} períodos académicos registrados`}
            aria-busy={cargandoPeriodos}
          >
            <span className="dashboard-metric-icon"><CalendarBlank size={20} aria-hidden="true" /></span>
            <span className="dashboard-metric-content">
              <span className="dashboard-metric-label">Períodos académicos</span>
              <strong>{cargandoPeriodos ? <i className="dashboard-skeleton metric-skeleton" aria-hidden="true" /> : periodos.items.length}</strong>
              <span className="dashboard-metric-detail">Calendario lectivo</span>
            </span>
            <ArrowRight className="dashboard-metric-arrow" size={17} aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="dashboard-section dashboard-actions-section" aria-labelledby="dashboard-actions-title">
        <div className="dashboard-section-heading">
          <div>
            <h2 id="dashboard-actions-title">Accesos directos</h2>
            <p>Entrá rápido a las tareas habituales.</p>
          </div>
        </div>
        <div className="dashboard-action-grid">
          <button type="button" className="action-card dashboard-action-card" onClick={onCreate}>
            <span className="action-icon"><Plus size={19} aria-hidden="true" /></span>
            <span><strong>Gestionar carreras</strong><small>Consultar y crear propuestas académicas</small></span>
            <ArrowRight className="action-arrow" size={16} aria-hidden="true" />
          </button>
          <button type="button" className="action-card dashboard-action-card" onClick={() => onNavigate('Sedes y aulas')}>
            <span className="action-icon"><Buildings size={19} aria-hidden="true" /></span>
            <span><strong>Ver sedes y aulas</strong><small>Consultar los espacios disponibles</small></span>
            <ArrowRight className="action-arrow" size={16} aria-hidden="true" />
          </button>
          <button type="button" className="action-card dashboard-action-card" onClick={() => onNavigate('Períodos')}>
            <span className="action-icon"><CalendarBlank size={19} aria-hidden="true" /></span>
            <span><strong>Ver períodos</strong><small>Consultar el calendario académico</small></span>
            <ArrowRight className="action-arrow" size={16} aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="dashboard-lists-grid" aria-label="Registros académicos">
        <article className="panel dashboard-list-panel">
          <div className="panel-header">
            <div>
              <h2>Carreras</h2>
              <p>Propuestas académicas registradas</p>
            </div>
            <button type="button" className="text-button" onClick={() => onNavigate('Carreras')}>
              Ver todas<ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>

          {cargandoCarreras
            ? <LoadingRows label="carreras" />
            : carreras.items.length === 0 && carreras.error
              ? <div className="dashboard-inline-error"><WarningCircle size={18} aria-hidden="true" /><span>No se pudieron cargar las carreras. Usá “Reintentar” para volver a consultar.</span></div>
              : carreras.items.length === 0
                ? <EmptyResource
                    title="Todavía no hay carreras"
                    description="Cuando agregues una propuesta académica, vas a poder consultarla desde acá."
                    actionLabel="Ir a carreras"
                    onAction={() => onNavigate('Carreras')}
                  />
                : <ul className="dashboard-record-list">
                    {carreras.items.slice(0, 5).map((carrera) => {
                      const estado = estadoCarrera(carrera.estado)
                      return (
                        <li className="dashboard-career-row" key={carrera.id}>
                          <span className="dashboard-record-icon career-record-icon"><GraduationCap size={18} aria-hidden="true" /></span>
                          <span className="dashboard-record-copy">
                            <span className="dashboard-record-topline">
                              <strong>{carrera.nombre}</strong>
                              <span className={`dashboard-status ${estado.className}`}>{estado.label}</span>
                            </span>
                            <span className="dashboard-record-meta">{carrera.codigo} · {carrera.facultad}</span>
                            <span className="dashboard-record-detail">{carrera.titulo} · {carrera.duracion}</span>
                          </span>
                        </li>
                      )
                    })}
                  </ul>}

          {!cargandoCarreras && carreras.items.length > 5 && (
            <button type="button" className="dashboard-more-link" onClick={() => onNavigate('Carreras')}>
              Ver las {carreras.items.length - 5} carreras restantes<ArrowRight size={14} aria-hidden="true" />
            </button>
          )}
        </article>

        <div className="dashboard-side-panels">
          <article className="panel dashboard-list-panel">
            <div className="panel-header">
              <div>
                <h2>Sedes</h2>
                <p>Ubicaciones académicas</p>
              </div>
              <button type="button" className="text-button" onClick={() => onNavigate('Sedes y aulas')}>
                Ver todas<ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>

            {cargandoSedes
              ? <LoadingRows label="sedes" count={2} />
              : sedes.items.length === 0 && sedes.error
                ? <div className="dashboard-inline-error"><WarningCircle size={18} aria-hidden="true" /><span>No se pudieron cargar las sedes. Usá “Reintentar” para volver a consultar.</span></div>
                : sedes.items.length === 0
                  ? <EmptyResource
                      title="Todavía no hay sedes"
                      description="Las sedes que registres aparecerán en este resumen."
                      actionLabel="Ir a sedes y aulas"
                      onAction={() => onNavigate('Sedes y aulas')}
                    />
                  : <ul className="dashboard-record-list compact-record-list">
                      {sedes.items.slice(0, 3).map((sede) => (
                        <li className="dashboard-compact-row" key={sede.id}>
                          <span className="dashboard-record-icon campus-record-icon"><MapPin size={17} aria-hidden="true" /></span>
                          <span className="dashboard-record-copy">
                            <strong>{sede.nombre}</strong>
                            <span className="dashboard-record-meta">{sede.direccion || 'Dirección sin informar'}</span>
                          </span>
                        </li>
                      ))}
                    </ul>}
          </article>

          <article className="panel dashboard-list-panel">
            <div className="panel-header">
              <div>
                <h2>Períodos académicos</h2>
                <p>Fechas del calendario lectivo</p>
              </div>
              <button type="button" className="text-button" onClick={() => onNavigate('Períodos')}>
                Ver todos<ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>

            {cargandoPeriodos
              ? <LoadingRows label="períodos académicos" count={2} />
              : periodos.items.length === 0 && periodos.error
                ? <div className="dashboard-inline-error"><WarningCircle size={18} aria-hidden="true" /><span>No se pudieron cargar los períodos. Usá “Reintentar” para volver a consultar.</span></div>
                : periodos.items.length === 0
                  ? <EmptyResource
                      title="Todavía no hay períodos"
                      description="Los ciclos académicos que registres se mostrarán acá."
                      actionLabel="Ir a períodos"
                      onAction={() => onNavigate('Períodos')}
                    />
                  : <ul className="dashboard-record-list compact-record-list">
                      {periodos.items.slice(0, 3).map((periodo) => (
                        <li className="dashboard-compact-row" key={periodo.id}>
                          <span className="dashboard-record-icon period-record-icon"><CalendarBlank size={17} aria-hidden="true" /></span>
                          <span className="dashboard-record-copy">
                            <strong>Período {periodo.numero} · {periodo.anio}</strong>
                            <span className="dashboard-record-meta">{fechaLegible(periodo.fechaInicio)} – {fechaLegible(periodo.fechaFin)}</span>
                          </span>
                        </li>
                      ))}
                    </ul>}
          </article>
        </div>
      </section>
    </div>
  )
}
