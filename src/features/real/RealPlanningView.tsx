import { ArrowsClockwise, MapPin, WarningCircle } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { EmptyState } from '../../components/ui/EmptyState'
import { Toolbar } from '../../components/ui/Toolbar'
import { SurfaceSkeleton } from '../../components/ui/SurfaceSkeleton'
import { listarSedes, sincronizarSedes } from '../../services/sedes/sedesSlice'
import { listarAulas } from '../../services/aulas/aulasSlice'
import { AgendaPanel, AsignacionesPanel } from './PlanningAssignments'
import { CursosPanel } from './CursosPanel'
import type { Screen } from '../../types/domain'
import type { EstadoUbicacion, TipoUbicacion } from '../../types/api'
import './RealPlanningView.css'

export function RealPlanningView({ screen, query, setQuery, onNotify }: { screen: Screen; query: string; setQuery: (v: string) => void; onNotify: (v: string) => void }) {
  if (screen === 'Agenda') return <AgendaPanel />
  if (screen === 'Cursos') return <CursosPanel query={query} setQuery={setQuery} onNotify={onNotify} />
  if (screen === 'Asignaciones') return <AsignacionesPanel onNotify={onNotify} query={query} setQuery={setQuery} />
  return <SedesYAulasPanel query={query} setQuery={setQuery} onNotify={onNotify} />
}

function SedesYAulasPanel({ query, setQuery, onNotify }: { query: string; setQuery: (value: string) => void; onNotify: (v: string) => void }) {
  const dispatch = useAppDispatch()
  const sedes = useAppSelector((state) => state.sedes)
  const aulas = useAppSelector((state) => state.aulas)
  const [sedeId, setSedeId] = useState<number | null>(null)
  const [sincronizando, setSincronizando] = useState(false)

  useEffect(() => { dispatch(listarSedes()) }, [dispatch])
  useEffect(() => { if (sedeId) dispatch(listarAulas(sedeId)) }, [dispatch, sedeId])

  const sedesFiltradas = sedes.items.filter((s) => `${s.nombre} ${s.direccion}`.toLowerCase().includes(query.toLowerCase()))
  const aulasVisibles = aulas.items.filter((aula) => aula.sedeId === sedeId)

  const sincronizar = async () => {
    if (sincronizando) return
    setSincronizando(true)
    const resultado = await dispatch(sincronizarSedes())
    setSincronizando(false)
    if (sincronizarSedes.fulfilled.match(resultado)) {
      const r = resultado.payload
      onNotify(`Catálogo actualizado: ${r.sedesCreadas + r.sedesActualizadas} sedes y ${r.aulasCreadas + r.aulasActualizadas} aulas leídas de Backoffice.`)
      if (sedeId) dispatch(listarAulas(sedeId))
    }
  }

  return <>
    <Toolbar query={query} setQuery={setQuery} placeholder="Buscar sedes por nombre o dirección..." filters={false} />
    <div className="section-title"><span><h2>Sedes</h2></span></div>
    <p className="muted-copy">El catálogo de sedes y aulas lo administra Backoffice. Acá se consulta la copia sincronizada.</p>
    <div className="list-meta">
      <span>{sedes.items.length} sedes</span>
      <button className="text-button" type="button" onClick={sincronizar} disabled={sincronizando} aria-busy={sincronizando}>
        <ArrowsClockwise size={14} aria-hidden="true" /> {sincronizando ? 'Sincronizando…' : 'Sincronizar con Backoffice'}
      </button>
    </div>

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
            {sede.estado !== 'ACTIVE' && <span className={`status ${estadoClase[sede.estado]}`}><i />{estadoEtiqueta[sede.estado]}</span>}
          </button>
        })}
      </div>
    )}

    {sedes.error && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {sedes.error}</div>}

    <div className="section-title planning-section-divider"><span><h2>Aulas</h2></span></div>
    {!sedeId
      ? <p className="muted-copy">Elegí una sede arriba para ver sus aulas.</p>
      : <>
          {aulas.error && <div className="form-error summary" role="alert"><WarningCircle size={15} /> {aulas.error}</div>}
          <div className="list-meta"><span>{aulasVisibles.length} aulas</span></div>
          {aulas.cargando && aulasVisibles.length === 0 ? <SurfaceSkeleton label="aulas" /> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Código</th><th>Nombre</th><th>Tipo</th><th>Capacidad</th><th>Estado</th></tr></thead>
                <tbody>{aulasVisibles.map((aula) => <tr key={aula.id}>
                  <td><strong>{aula.codigo}</strong></td>
                  <td>{aula.nombre}</td>
                  <td>{tipoEtiqueta[aula.tipo] ?? aula.tipo}</td>
                  <td>{aula.capacidadMaxima} personas</td>
                  <td><span className={`status ${estadoClase[aula.estado]}`}><i />{estadoEtiqueta[aula.estado]}</span></td>
                </tr>)}</tbody>
              </table>
              {!aulas.cargando && aulasVisibles.length === 0 && <EmptyState query="" />}
            </div>
          )}
        </>}
  </>
}

const estadoEtiqueta: Record<EstadoUbicacion, string> = { ACTIVE: 'Activa', INACTIVE: 'Inactiva', MAINTENANCE: 'En mantenimiento' }
const estadoClase: Record<EstadoUbicacion, string> = { ACTIVE: 'success', INACTIVE: 'neutral', MAINTENANCE: 'warning' }
const tipoEtiqueta: Record<TipoUbicacion, string> = {
  AULA: 'Aula', LABORATORIO: 'Laboratorio', AUDITORIO: 'Auditorio', SALA_EVENTOS: 'Sala de eventos',
  COMEDOR: 'Comedor', BIBLIOTECA: 'Biblioteca', OFICINA: 'Oficina', DEPOSITO: 'Depósito', OTRO: 'Otro',
}
