import { authAxios } from '../api/authAxios'
import type { CondicionesRegularidadCurso, GuardarCondicionesRegularidad } from '../../types/api'

const BASE = '/api/regularidad/cursos'

export const regularidadService = {
  consultar: (cursoId: number) =>
    authAxios.get<CondicionesRegularidadCurso>(`${BASE}/${cursoId}`).then((r) => r.data),
  actualizar: (cursoId: number, datos: GuardarCondicionesRegularidad) =>
    authAxios.put<CondicionesRegularidadCurso>(`${BASE}/${cursoId}`, datos).then((r) => r.data),
}
