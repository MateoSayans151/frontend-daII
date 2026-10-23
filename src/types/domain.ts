import type { Icon } from '@phosphor-icons/react'

export type Screen =
  | 'Resumen'
  | 'Carreras'
  | 'Planes de estudio'
  | 'Asignaturas'
  | 'Correlatividades'
  | 'Sedes y aulas'
  | 'Cursos'
  | 'Asignaciones'
  | 'Agenda'
  | 'Períodos'
  | 'Turnos de examen'
  | 'Regularidad'

export type NavGroup = {
  label: string
  items: { name: Screen; icon: Icon }[]
}
