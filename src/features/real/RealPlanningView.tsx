import { Check, MapPin, WarningCircle } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { EmptyState } from '../../components/ui/EmptyState'
import { Toolbar } from '../../components/ui/Toolbar'
import { SurfaceSkeleton } from '../../components/ui/SurfaceSkeleton'
import { crearSede, listarSedes } from '../../services/sedes/sedesSlice'
import { crearAula, listarAulas } from '../../services/aulas/aulasSlice'
import { AgendaPanel, AsignacionesPanel } from './PlanningAssignments'
import { CursosPanel } from './CursosPanel'
import type { Screen } from '../../types/domain'
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
                <label>Edificio (opcional)<input maxLength={255} value={nuevaAula.nombre} onChange={(e) => setNuevaAula({ ...nuevaAula, nombre: e.target.value })} placeholder="Ej. Aula de informática" /></label>
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
                <thead><tr><th>Código</th><th>Edificio</th><th>Capacidad</th></tr></thead>
                <tbody>{aulasVisibles.map((aula) => <tr key={aula.id}><td><strong>{aula.codigo}</strong></td><td>{aula.nombre}</td><td>{aula.capacidadMaxima} personas</td></tr>)}</tbody>
              </table>
              {!aulas.cargando && aulasVisibles.length === 0 && <EmptyState query="" />}
            </div>
          )}
        </>}
  </>
}

