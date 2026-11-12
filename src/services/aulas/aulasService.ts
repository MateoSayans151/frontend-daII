import { authAxios } from '../api/authAxios'
import type { Aula, CrearAula } from '../../types/api'

export const aulasService = {
  listar: (sedeId: number) =>
    authAxios.get<Aula[]>(`/api/v1/planificacion/sedes/${sedeId}/aulas`).then((r) => r.data),
  crear: (sedeId: number, datos: CrearAula) =>
    authAxios.post<Aula>(`/api/v1/planificacion/sedes/${sedeId}/aulas`, datos).then((r) => r.data),
}
