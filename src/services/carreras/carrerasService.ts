import { authAxios } from '../api/authAxios'
import type { Carrera, CrearCarrera } from '../../types/api'

const BASE = '/api/v1/academica/carreras'

export const carrerasService = {
  listar: () => authAxios.get<Carrera[]>(BASE).then((r) => r.data),
  crear: (datos: CrearCarrera) => authAxios.post<Carrera>(BASE, datos).then((r) => r.data),
  actualizar: (id: number, datos: CrearCarrera) =>
    authAxios.put<Carrera>(`${BASE}/${id}`, datos).then((r) => r.data),
  desactivar: (id: number) => authAxios.delete<void>(`${BASE}/${id}`),
}
