import { authAxios } from '../api/authAxios'
import type { CondicionesRegularidad, Correlatividad, CrearCorrelatividad } from '../../types/api'

export const correlatividadesService = {
  listar: (asignaturaId: number) =>
    authAxios
      .get<CondicionesRegularidad>(`/api/academica/asignaturas/${asignaturaId}/correlatividades`)
      .then((r) => r.data),
  crear: (asignaturaId: number, datos: CrearCorrelatividad) =>
    authAxios
      .post<Correlatividad>(`/api/academica/asignaturas/${asignaturaId}/correlatividades`, datos)
      .then((r) => r.data),
}
