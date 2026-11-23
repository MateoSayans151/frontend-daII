import { authAxios } from '../api/authAxios'
import type { Aula } from '../../types/api'

// Igual que las sedes, las aulas vienen de Backoffice: se descartan las que no tienen locationId.
export const aulasService = {
  listar: (sedeId: number) =>
    authAxios.get<Aula[]>(`/api/v1/planificacion/sedes/${sedeId}/aulas`)
      .then((r) => r.data.filter((aula) => aula.backofficeLocationId)),
}
