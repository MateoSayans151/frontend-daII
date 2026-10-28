import { authAxios } from '../api/authAxios'
import type { ActualizarPlanDeEstudio, CrearPlanDeEstudio, PlanDeEstudio } from '../../types/api'

export const planesEstudioService = {
  listar: (carreraId: number) =>
    authAxios.get<PlanDeEstudio[]>(`/api/academica/carreras/${carreraId}/planes`).then((r) => r.data),
  crear: (carreraId: number, datos: CrearPlanDeEstudio) =>
    authAxios.post<PlanDeEstudio>(`/api/academica/carreras/${carreraId}/planes`, datos).then((r) => r.data),
  actualizar: (planId: number, datos: ActualizarPlanDeEstudio) =>
    authAxios.put<PlanDeEstudio>(`/api/academica/planes/${planId}`, datos).then((r) => r.data),
  eliminar: (planId: number) => authAxios.delete(`/api/academica/planes/${planId}`),
  // Devuelve el PDF como blob para que el componente arme un link de descarga;
  // no se guarda en el store, no es un dato de estado sino un archivo puntual.
  descargarPdf: (planId: number) =>
    authAxios.get<Blob>(`/api/academica/planes/${planId}/pdf`, { responseType: 'blob' }).then((r) => r.data),
}
