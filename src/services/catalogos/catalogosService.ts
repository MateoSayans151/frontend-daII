import type { Asignatura, Aula, PeriodoAcademico, Sede } from '../../types/api'
import { asignaturasService } from '../asignaturas/asignaturasService'
import { aulasService } from '../aulas/aulasService'
import { carrerasService } from '../carreras/carrerasService'
import { periodosService } from '../periodos/periodosService'
import { planesEstudioService } from '../planesEstudio/planesEstudioService'
import { sedesService } from '../sedes/sedesService'
import { extraerMensajeError } from '../api/erroresApi'

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

async function listarTodasLasAulas(sedes: Sede[]): Promise<{
  aulas: AulaCatalogo[]
  advertencias: string[]
}> {
  const resultados = await Promise.allSettled(
    sedes.map(async (sede) => {
      const aulas = await aulasService.listar(sede.id)
      return aulas.map((aula) => ({ ...aula, sedeNombre: sede.nombre }))
    }),
  )
  const aulas = resultados
    .filter((resultado): resultado is PromiseFulfilledResult<AulaCatalogo[]> => resultado.status === 'fulfilled')
    .flatMap((resultado) => resultado.value)
  const advertencias = resultados.flatMap((resultado, indice) =>
    resultado.status === 'rejected'
      ? [`No se pudieron cargar las aulas de ${sedes[indice].nombre}: ${extraerMensajeError(resultado.reason)}`]
      : [],
  )
  return { aulas, advertencias }
}

export interface CatalogosPlanificacion {
  asignaturas: Asignatura[]
  periodos: PeriodoAcademico[]
  sedes: Sede[]
  aulas: AulaCatalogo[]
  advertencias: string[]
}

export const catalogosService = {
  listarAsignaturas: listarTodasLasAsignaturas,
  async paraAsignaciones(): Promise<Pick<CatalogosPlanificacion, 'asignaturas' | 'aulas' | 'advertencias'>> {
    const [resultadoAsignaturas, resultadoSedes] = await Promise.allSettled([
      listarTodasLasAsignaturas(), sedesService.listar(),
    ])
    const advertencias: string[] = []
    if (resultadoAsignaturas.status === 'rejected') {
      advertencias.push(`No se pudieron cargar asignaturas: ${extraerMensajeError(resultadoAsignaturas.reason)}`)
    }
    if (resultadoSedes.status === 'rejected') {
      advertencias.push(`No se pudieron cargar sedes: ${extraerMensajeError(resultadoSedes.reason)}`)
    }
    const sedes = resultadoSedes.status === 'fulfilled' ? resultadoSedes.value : []
    const resultadoAulas = await listarTodasLasAulas(sedes)
    return {
      asignaturas: resultadoAsignaturas.status === 'fulfilled' ? resultadoAsignaturas.value : [],
      aulas: resultadoAulas.aulas,
      advertencias: [...advertencias, ...resultadoAulas.advertencias],
    }
  },
  async paraPlanificacion(): Promise<CatalogosPlanificacion> {
    const resultados = await Promise.allSettled([
      listarTodasLasAsignaturas(),
      periodosService.listar(),
      sedesService.listar(),
    ])
    const nombres = ['asignaturas', 'períodos', 'sedes']
    const advertencias = resultados.flatMap((resultado, indice) =>
      resultado.status === 'rejected'
        ? [`No se pudieron cargar ${nombres[indice]}: ${extraerMensajeError(resultado.reason)}`]
        : [],
    )
    const asignaturas = resultados[0].status === 'fulfilled' ? resultados[0].value : []
    const periodos = resultados[1].status === 'fulfilled' ? resultados[1].value : []
    const sedes = resultados[2].status === 'fulfilled' ? resultados[2].value : []
    const resultadoAulas = await listarTodasLasAulas(sedes)
    return {
      asignaturas,
      periodos,
      sedes,
      aulas: resultadoAulas.aulas,
      advertencias: [...advertencias, ...resultadoAulas.advertencias],
    }
  },
}
