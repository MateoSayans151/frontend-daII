import { authAxios } from "../api/authAxios";
import type {
  AsignarDocenteCurso,
  ActualizarHorarioCurso,
  ActualizarInscripcionCurso,
  CrearInscripcionCurso,
  CrearCurso,
  Curso,
  CursoDetalle,
} from "../../types/api";

const BASE = "/api/planificacion/cursos";

export const cursosService = {
  listar: (periodoId?: number) =>
    authAxios
      .get<Curso[]>(BASE, { params: periodoId ? { periodoId } : undefined })
      .then((r) => r.data),
  obtener: (id: number) =>
    Promise.all([
      authAxios.get<{
        curso: Curso & { asignatura: { id: number }; periodo: { id: number } }
      }>(`${BASE}/${id}`),
      authAxios.get<CursoDetalle['docentes']>(`${BASE}/${id}/docentes`),
      authAxios.get<CursoDetalle['inscripciones']>(`${BASE}/${id}/alumnos`),
      authAxios.get<CursoDetalle['regularidad']>(`/api/regularidad/cursos/${id}`),
    ]).then(([detalle, docentes, alumnos, regularidad]) => ({
      ...detalle.data.curso,
      asignaturaId: detalle.data.curso.asignatura.id,
      periodoId: detalle.data.curso.periodo.id,
      docentes: docentes.data,
      inscripciones: alumnos.data,
      regularidad: regularidad.data,
    })),
  crear: (datos: CrearCurso) =>
    authAxios.post<Curso>(BASE, datos).then((r) => r.data),
  actualizarEstado: (id: number, estado: string) =>
    authAxios.put(`${BASE}/${id}/estado`, { estado }).then(() => undefined),
  actualizarHorario: (id: number, datos: ActualizarHorarioCurso) =>
    authAxios.put(`${BASE}/${id}/horario`, datos).then(() => undefined),
  asignarDocente: (id: number, datos: AsignarDocenteCurso) =>
    authAxios.post(`${BASE}/${id}/docentes`, datos).then(() => undefined),
  guardarInscripcion: (id: number, datos: CrearInscripcionCurso) =>
    authAxios.post(`${BASE}/${id}/inscripciones`, datos).then(() => undefined),
  actualizarInscripcion: (
    id: number,
    alumnoId: string,
    datos: ActualizarInscripcionCurso,
  ) =>
    authAxios
      .put(`${BASE}/${id}/inscripciones/${encodeURIComponent(alumnoId)}`, datos)
      .then(() => undefined),
};
