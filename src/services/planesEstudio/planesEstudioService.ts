import { authAxios } from '../api/authAxios'
import type { ActualizarPlanDeEstudio, CrearPlanDeEstudio, PlanDeEstudio } from '../../types/api'

export const planesEstudioService = {
  listar: (carreraId: number) =>
    authAxios.get<PlanDeEstudio[]>(`/api/v1/academica/carreras/${carreraId}/planes`).then((r) => r.data),
  crear: (carreraId: number, datos: CrearPlanDeEstudio) =>
    authAxios.post<PlanDeEstudio>(`/api/v1/academica/carreras/${carreraId}/planes`, datos).then((r) => r.data),
  actualizar: (planId: number, datos: ActualizarPlanDeEstudio) =>
    authAxios.put<PlanDeEstudio>(`/api/v1/academica/planes/${planId}`, datos).then((r) => r.data),
  eliminar: (planId: number) => authAxios.delete(`/api/v1/academica/planes/${planId}`),
}
