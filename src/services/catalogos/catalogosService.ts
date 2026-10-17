import type { Asignatura, Aula, PeriodoAcademico, Sede } from '../../types/api'
import { asignaturasService } from '../asignaturas/asignaturasService'
import { aulasService } from '../aulas/aulasService'
import { carrerasService } from '../carreras/carrerasService'
import { periodosService } from '../periodos/periodosService'
import { planesEstudioService } from '../planesEstudio/planesEstudioService'
import { sedesService } from '../sedes/sedesService'

export interface AulaCatalogo extends Aula {
  sedeNombre: string
}

async function listarTodasLasAsignaturas(): Promise<Asignatura[]> {
  const carreras = await carrerasService.listar()
  const planes = (await Promise.all(
    carreras.map((carrera) => planesEstudioService.listar(carrera.id)),
  )).flat()

  return (await Promise.all(
    planes.map((plan) => asignaturasService.listar(plan.id)),
  )).flat()
}

async function listarTodasLasAulas(sedes: Sede[]): Promise<AulaCatalogo[]> {
  const aulasPorSede = await Promise.all(
    sedes.map(async (sede) => {
      const aulas = await aulasService.listar(sede.id)
      return aulas.map((aula) => ({ ...aula, sedeNombre: sede.nombre }))
    }),
  )
  return aulasPorSede.flat()
}

export const catalogosService = {
  async paraPlanificacion(): Promise<{
    asignaturas: Asignatura[]
    periodos: PeriodoAcademico[]
    sedes: Sede[]
    aulas: AulaCatalogo[]
  }> {
    const [asignaturas, periodos, sedes] = await Promise.all([
      listarTodasLasAsignaturas(),
      periodosService.listar(),
      sedesService.listar(),
    ])
    const aulas = await listarTodasLasAulas(sedes)
    return { asignaturas, periodos, sedes, aulas }
  },
}
