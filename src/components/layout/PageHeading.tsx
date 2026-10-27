import { Plus } from '@phosphor-icons/react'
import type { Screen } from '../../types/domain'

type PageHeadingProps = { screen: Screen; onCreate?: () => void }

const copy: Record<Screen, [string, string]> = {
  Resumen: ['Buen día, equipo.', 'Organizá la estructura académica y planificá el próximo cuatrimestre desde un único lugar.'],
  Carreras: ['Carreras', 'Administrá las propuestas académicas de la universidad.'],
  'Planes de estudio': ['Planes de estudio', 'Diseñá la trayectoria de cada carrera, con sus materias y correlatividades.'],
  Asignaturas: ['Asignaturas', 'Mantené el catálogo de materias y sus datos académicos.'],
  Correlatividades: ['Correlatividades', 'Definí qué asignaturas debe aprobar un estudiante antes de cursar otra.'],
  'Sedes y aulas': ['Sedes y aulas', 'Organizá los espacios físicos disponibles por sede y capacidad.'],
  Cursos: ['Cursos', 'Administrá cursos, docentes, inscripciones, resultados y horarios.'],
  Asignaciones: ['Asignaciones', 'Distribuí cursos, aulas y horarios evitando superposiciones.'],
  Agenda: ['Agenda', 'Consultá la ocupación de cada aula por fecha.'],
  Períodos: ['Períodos académicos', 'Definí las fechas que ordenan cada ciclo lectivo.'],
  'Turnos de examen': ['Turnos de examen', 'Publicá las fechas y aulas para los finales.'],
  Regularidad: ['Condiciones de regularidad', 'Consultá qué exige cada curso para regularizar la cursada.'],
}

export function PageHeading({ screen, onCreate }: PageHeadingProps) {
  const [title, subtitle] = copy[screen]
  return <div className="page-heading"><div><div className="eyebrow">SECRETARÍA ACADÉMICA</div><h1>{title}</h1><p>{subtitle}</p></div>{screen !== 'Resumen' && onCreate && <button className="primary-button heading-action" onClick={onCreate}><Plus size={17} /> Crear nuevo</button>}</div>
}
