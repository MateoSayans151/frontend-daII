// Tipos que reflejan los DTOs del backend (Modelos/*.java).

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
export interface MateriaCorrelativa {
  id: number
  codigo: string
  nombre: string
}
export interface CondicionCorrelatividad {
  tipo: TipoCorrelatividad
  materiasCorrelativas: MateriaCorrelativa[]
}
export interface CondicionesRegularidad {
  asignaturaId: number
  condiciones: CondicionCorrelatividad[]
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
  nombre: string
  capacidadMaxima: number
  sedeId: number
}
export interface CrearAula {
  codigo: string
  capacidadMaxima: number
  nombre?: string
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

export interface OcupacionAula {
  tipo: 'CURSO' | 'ASIGNACION'
  referenciaId: number
  aulaId: number
  asignaturaId: number
  asignaturaCodigo: string
  asignaturaNombre: string
  cursoCodigo: string | null
  fecha: string
  horaInicio: string
  horaFin: string
  cantidadEstudiantes: number | null
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
  diaSemana: string | null
  aulaId: number | null
  sedeNombre: string
  aulaNombre: string | null
}
export interface CrearCurso {
  codigo: string
  asignaturaId: number
  periodoId: number
  sedeId: number
  modalidad: string
  cupoMaximo: number
  fechaInicio: string
  fechaFin: string
  turno: 'TARDE' | 'MAÑANA' | 'NOCHE' | ''
  horaInicio: string
  horaFin: string
  diaSemana: string
  aulaId: number
  asistenciaMinima: number
  promedioMinimo: number
}
export interface ActualizarHorarioCurso {
  aulaId: number
  diaSemana: string
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
export interface CrearInscripcionCurso {
  alumnoId: string
}
export interface ActualizarInscripcionCurso {
  estado: string
  notaFinal?: number | null
  fechaResultado?: string | null
}

export interface CursoDetalle extends Curso {
  docentes: DocenteCurso[]
  inscripciones: InscripcionCurso[]
  regularidad: CondicionesRegularidadCurso
}

export interface PeriodoAcademico {
  id: number
  anio: number
  numero: number
  fechaInicio: string
  fechaFin: string
  inscripcionDesde: string
  inscripcionHasta: string
}
export interface CrearPeriodoAcademico {
  anio: number
  numero: number
  fechaInicio: string
  fechaFin: string
  inscripcionDesde: string
  inscripcionHasta: string
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

export interface GuardarCondicionesRegularidad {
  asistenciaMinima: number
  promedioMinimo: number
}
export interface CondicionesRegularidadCurso extends GuardarCondicionesRegularidad {
  id: number
  cursoId: number
  codigo: string
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
export interface LoginUsuario {
  email: string
  password: string
}
