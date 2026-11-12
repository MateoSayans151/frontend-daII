import { authAxios } from '../api/authAxios'
import type { Asignatura, CrearAsignatura } from '../../types/api'

export const asignaturasService = {
  listar: (planId: number) =>
    authAxios.get<Asignatura[]>(`/api/v1/academica/planes/${planId}/asignaturas`).then((r) => r.data),
  crear: (planId: number, datos: CrearAsignatura) =>
    authAxios.post<Asignatura>(`/api/v1/academica/planes/${planId}/asignaturas`, datos).then((r) => r.data),
}
