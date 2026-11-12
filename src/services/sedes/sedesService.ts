import { authAxios } from '../api/authAxios'
import type { CrearSede, Sede } from '../../types/api'

const BASE = '/api/v1/planificacion/sedes'

export const sedesService = {
  listar: () => authAxios.get<Sede[]>(BASE).then((r) => r.data),
  crear: (datos: CrearSede) => authAxios.post<Sede>(BASE, datos).then((r) => r.data),
}
