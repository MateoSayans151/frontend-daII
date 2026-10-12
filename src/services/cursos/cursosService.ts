import { authAxios } from "../api/authAxios";
import type {
  AsignarDocenteCurso,
  ActualizarHorarioCurso,
  CrearCurso,
  Curso,
  CursoDetalle,
  GuardarInscripcionCurso,
} from "../../types/api";

const BASE = "/api/planificacion/cursos";

export const cursosService = {
  listar: (periodoId?: number) =>
    authAxios
      .get<Curso[]>(BASE, { params: periodoId ? { periodoId } : undefined })
      .then((r) => r.data),
  obtener: (id: number) =>
    authAxios.get<{
      curso: Curso & { asignatura: { id: number }; periodo: { id: number } }
      docentes: CursoDetalle['docentes']
      inscripciones: CursoDetalle['inscripciones']
    }>(`${BASE}/${id}`).then(({ data }) => ({
      ...data.curso,
      asignaturaId: data.curso.asignatura.id,
      periodoId: data.curso.periodo.id,
      docentes: data.docentes,
      inscripciones: data.inscripciones,
    })),
  crear: (datos: CrearCurso) =>
    authAxios.post<Curso>(BASE, datos).then((r) => r.data),
  actualizarEstado: (id: number, estado: string) =>
    authAxios.put(`${BASE}/${id}/estado`, { estado }).then(() => undefined),
  actualizarHorario: (id: number, datos: ActualizarHorarioCurso) =>
    authAxios.put(`${BASE}/${id}/horario`, datos).then(() => undefined),
  asignarDocente: (id: number, datos: AsignarDocenteCurso) =>
    authAxios.post(`${BASE}/${id}/docentes`, datos).then(() => undefined),
  guardarInscripcion: (id: number, datos: GuardarInscripcionCurso) =>
    authAxios.post(`${BASE}/${id}/inscripciones`, datos).then(() => undefined),
  actualizarInscripcion: (
    id: number,
    alumnoId: string,
    datos: GuardarInscripcionCurso,
  ) =>
    authAxios
      .put(`${BASE}/${id}/inscripciones/${encodeURIComponent(alumnoId)}`, datos)
      .then(() => undefined),
};
