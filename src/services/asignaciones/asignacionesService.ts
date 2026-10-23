import { authAxios } from '../api/authAxios'
import type { Asignacion, CrearAsignacion, OcupacionAula } from '../../types/api'

export const asignacionesService = {
  listar: () =>
    authAxios.get<Asignacion[]>('/api/planificacion/asignaciones').then((r) => r.data),
  crear: (datos: CrearAsignacion) =>
    authAxios.post<Asignacion>('/api/planificacion/asignaciones', datos).then((r) => r.data),
  agendaAsignatura: (asignaturaId: number, desde: string, hasta: string) =>
    authAxios.get<Asignacion[]>(`/api/planificacion/asignaturas/${asignaturaId}/agenda`, {
      params: { desde, hasta },
    }).then((r) => r.data),
  agendaAulaPorFecha: (aulaId: number, fecha: string) =>
    authAxios
      .get<OcupacionAula[]>(`/api/planificacion/aulas/${aulaId}/agenda`, { params: { fecha } })
      .then((r) => r.data),
  agendaAula: (aulaId: number, desde: string, hasta: string) =>
    authAxios.get<OcupacionAula[]>(`/api/planificacion/aulas/${aulaId}/agenda`, {
      params: { desde, hasta },
    }).then((r) => r.data),
}
