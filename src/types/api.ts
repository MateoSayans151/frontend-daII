// Tipos que reflejan 1 a 1 los DTOs del backend (Modelos/*.java).
// Viven separados de types/domain.ts, que todavia alimenta las pantallas mock.

export type EstadoAcademico = 'ACTIVA' | 'BORRADOR' | 'INACTIVA'

export interface Carrera {
  id: number
  codigo: string
  nombre: string
  facultad: string
  duracion: string
  titulo: string
  estado: EstadoAcademico
}
export interface CrearCarrera {
  codigo: string
  nombre: string
  facultad: string
  duracion: string
  titulo: string
}

export interface PlanDeEstudio {
  id: number
  codigo: string
  nombre: string
  vigenciaDesde: string
  cantidadAsignaturas: number
  estado: EstadoAcademico
  carreraId: number
}
export interface CrearPlanDeEstudio {
  codigo: string
  nombre: string
  vigenciaDesde: string
  cantidadAsignaturas: number
}

export interface Asignatura {
  id: number
  codigo: string
  nombre: string
  anio: number
  creditos: number
  cargaHoraria: number
  estado: EstadoAcademico
  planId: number
}
export interface CrearAsignatura {
  codigo: string
  nombre: string
  anio: number
  creditos: number
  cargaHoraria: number
}

export type TipoCorrelatividad = 'REGULAR' | 'APROBADA'
export interface Correlatividad {
  id: number
  asignaturaId: number
  correlativaId: number
  tipo: TipoCorrelatividad
}
export interface CrearCorrelatividad {
  correlativaId: number
  tipo: TipoCorrelatividad
}

export interface Sede {
  id: number
  nombre: string
  direccion: string
}
export interface CrearSede {
  nombre: string
  direccion: string
}

export interface Aula {
  id: number
  codigo: string
  capacidadMaxima: number
  sedeId: number
}
export interface CrearAula {
  codigo: string
  capacidadMaxima: number
}

export interface Asignacion {
  id: number
  aulaId: number
  asignaturaId: number
  fecha: string
  horaInicio: string
  horaFin: string
  cantidadEstudiantes: number
}
export interface CrearAsignacion {
  aulaId: number
  asignaturaId: number
  fecha: string
  horaInicio: string
  horaFin: string
  cantidadEstudiantes: number
}

export interface Curso {
  id: number
  codigo: string
  asignaturaId: number
  periodoId: number
  sedeId: number
  modalidad: string
  estado: string
  cupoMaximo: number
  fechaInicio: string
  fechaFin: string
  turno: 'TARDE' | 'MAÑANA' | 'NOCHE' | null
  horaInicio: string | null
  horaFin: string | null
}
export interface CrearCurso {
  codigo: string
  asignaturaId: number
  periodoId: number
  sedeId: number
  modalidad: string
  estado: string
  cupoMaximo: number
  fechaInicio: string
  fechaFin: string
  turno: 'TARDE' | 'MAÑANA' | 'NOCHE' | ''
  horaInicio: string
  horaFin: string
}

export interface DocenteCurso {
  id: number
  cursoId: number
  docenteId: string
  rol: string
}
export interface AsignarDocenteCurso {
  docenteId: string
  rol: string
}

export interface InscripcionCurso {
  id: number
  cursoId: number
  alumnoId: string
  fechaInscripcion: string
  estado: string
  notaFinal: number | null
  fechaResultado: string | null
}
export interface GuardarInscripcionCurso {
  alumnoId: string
  fechaInscripcion: string
  estado: string
  notaFinal?: number | null
  fechaResultado?: string | null
}

export interface HorarioCurso {
  id: number
  cursoId: number
  aulaId: number
  diaSemana: string
  horaInicio: string
  horaFin: string
}
export interface CrearHorarioCurso {
  aulaId: number
  diaSemana: string
  horaInicio: string
  horaFin: string
}

export interface CursoDetalle extends Curso {
  docentes: DocenteCurso[]
  inscripciones: InscripcionCurso[]
  horarios: HorarioCurso[]
}

export interface PeriodoAcademico {
  id: number
  anio: number
  numero: number
  fechaInicio: string
  fechaFin: string
}
export interface CrearPeriodoAcademico {
  anio: number
  numero: number
  fechaInicio: string
  fechaFin: string
}

export interface TurnoExamen {
  id: number
  nombre: string
  fechaInicio: string
  fechaFin: string
  inscripcionDesde: string
  inscripcionHasta: string
}
export interface CrearTurnoExamen {
  nombre: string
  fechaInicio: string
  fechaFin: string
  inscripcionDesde: string
  inscripcionHasta: string
}

export interface ValidarRegularidad {
  asistencia: number
  promedio: number
  asistenciaMinima: number
  promedioMinimo: number
}
export interface ResultadoRegularidad {
  regular: boolean
  habilitadoParaFinal: boolean
  motivos: string[]
}

export type Permiso = string
export interface Usuario {
  id: string
  nombre: string
  email: string
  permiso: Permiso
  roles: string[]
  permissions: string[]
  status: string
  activo: boolean
}
export interface CrearUsuario {
  nombre: string
  email: string
  password: string
  permiso: Permiso
}
export interface LoginUsuario {
  email: string
  password: string
}
