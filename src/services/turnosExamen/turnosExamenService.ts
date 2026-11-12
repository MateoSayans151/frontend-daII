import { authAxios } from '../api/authAxios'
import type { CrearTurnoExamen, TurnoExamen } from '../../types/api'

const BASE = '/api/v1/planificacion/turnos-examen'

export const turnosExamenService = {
  listar: () => authAxios.get<TurnoExamen[]>(BASE).then((r) => r.data),
  crear: (datos: CrearTurnoExamen) => authAxios.post<TurnoExamen>(BASE, datos).then((r) => r.data),
}
