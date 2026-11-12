import { authAxios } from '../api/authAxios'
import type { CrearPeriodoAcademico, PeriodoAcademico } from '../../types/api'

const BASE = '/api/v1/planificacion/periodos'

export const periodosService = {
  listar: () => authAxios.get<PeriodoAcademico[]>(BASE).then((r) => r.data),
  crear: (datos: CrearPeriodoAcademico) => authAxios.post<PeriodoAcademico>(BASE, datos).then((r) => r.data),
}
