import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { extraerMensajeError } from '../api/erroresApi'
import { cursosService } from './cursosService'
import type {
  AsignarDocenteCurso,
  ActualizarHorarioCurso,
  CrearCurso,
  Curso,
  CursoDetalle,
  GuardarInscripcionCurso,
} from '../../types/api'

interface EstadoCursos {
  items: Curso[]
  seleccionado: CursoDetalle | null
  cargando: boolean
  cargandoDetalle: boolean
  error: string | null
}

const estadoInicial: EstadoCursos = {
  items: [],
  seleccionado: null,
  cargando: false,
  cargandoDetalle: false,
  error: null,
}

export const listarCursos = createAsyncThunk<Curso[], number | undefined, { rejectValue: string }>(
  'cursos/listar',
  async (periodoId, { rejectWithValue }) => {
    try {
      return await cursosService.listar(periodoId)
    } catch (error) {
      return rejectWithValue(extraerMensajeError(error))
    }
  },
)

export const obtenerCurso = createAsyncThunk<CursoDetalle, number, { rejectValue: string }>(
  'cursos/obtener',
  async (id, { rejectWithValue }) => {
    try {
      return await cursosService.obtener(id)
    } catch (error) {
      return rejectWithValue(extraerMensajeError(error))
    }
  },
)

export const crearCurso = createAsyncThunk<Curso, CrearCurso, { rejectValue: string }>(
  'cursos/crear',
  async (datos, { rejectWithValue }) => {
    try {
      return await cursosService.crear(datos)
    } catch (error) {
      return rejectWithValue(extraerMensajeError(error))
    }
  },
)

export const actualizarEstadoCurso = createAsyncThunk<
  void,
  { id: number; estado: string },
  { rejectValue: string }
>('cursos/actualizarEstado', async ({ id, estado }, { rejectWithValue }) => {
  try {
    await cursosService.actualizarEstado(id, estado)
  } catch (error) {
    return rejectWithValue(extraerMensajeError(error))
  }
})

export const actualizarHorarioCurso = createAsyncThunk<
  void,
  { id: number; datos: ActualizarHorarioCurso },
  { rejectValue: string }
>('cursos/actualizarHorario', async ({ id, datos }, { rejectWithValue }) => {
  try {
    await cursosService.actualizarHorario(id, datos)
  } catch (error) {
    return rejectWithValue(extraerMensajeError(error))
  }
})

export const asignarDocenteCurso = createAsyncThunk<
  void,
  { id: number; datos: AsignarDocenteCurso },
  { rejectValue: string }
>('cursos/asignarDocente', async ({ id, datos }, { rejectWithValue }) => {
  try {
    await cursosService.asignarDocente(id, datos)
  } catch (error) {
    return rejectWithValue(extraerMensajeError(error))
  }
})

export const guardarInscripcionCurso = createAsyncThunk<
  void,
  { id: number; datos: GuardarInscripcionCurso; actualizar: boolean },
  { rejectValue: string }
>('cursos/guardarInscripcion', async ({ id, datos, actualizar }, { rejectWithValue }) => {
  try {
    if (actualizar) {
      if (!datos.alumnoId) return rejectWithValue('Falta el ID del alumno para actualizar la inscripción')
      await cursosService.actualizarInscripcion(id, datos.alumnoId, datos)
    }
    else await cursosService.guardarInscripcion(id, datos)
  } catch (error) {
    return rejectWithValue(extraerMensajeError(error))
  }
})

const cursosSlice = createSlice({
  name: 'cursos',
  initialState: estadoInicial,
  reducers: {
    limpiarCursoSeleccionado(state) {
      state.seleccionado = null
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listarCursos.pending, (state) => {
        state.cargando = true
        state.error = null
      })
      .addCase(listarCursos.fulfilled, (state, action: PayloadAction<Curso[]>) => {
        state.cargando = false
        state.items = action.payload
      })
      .addCase(listarCursos.rejected, (state, action) => {
        state.cargando = false
        state.error = action.payload ?? 'No se pudieron obtener los cursos'
      })
      .addCase(obtenerCurso.pending, (state) => {
        state.cargandoDetalle = true
        state.error = null
      })
      .addCase(obtenerCurso.fulfilled, (state, action: PayloadAction<CursoDetalle>) => {
        state.cargandoDetalle = false
        state.seleccionado = action.payload
      })
      .addCase(obtenerCurso.rejected, (state, action) => {
        state.cargandoDetalle = false
        state.error = action.payload ?? 'No se pudo obtener el curso'
      })
      .addCase(crearCurso.fulfilled, (state, action: PayloadAction<Curso>) => {
        state.items.push(action.payload)
      })
      .addCase(crearCurso.rejected, (state, action) => {
        state.error = action.payload ?? 'No se pudo crear el curso'
      })
      .addMatcher(
        (action) =>
          [
            actualizarEstadoCurso.pending.type,
            actualizarHorarioCurso.pending.type,
            asignarDocenteCurso.pending.type,
            guardarInscripcionCurso.pending.type,
          ].includes(action.type),
        (state) => {
          state.error = null
        },
      )
      .addMatcher(
        (action) =>
          [
            actualizarEstadoCurso.rejected.type,
            actualizarHorarioCurso.rejected.type,
            asignarDocenteCurso.rejected.type,
            guardarInscripcionCurso.rejected.type,
          ].includes(action.type),
        (state, action: { payload?: string }) => {
          state.error = action.payload ?? 'No se pudo actualizar el curso'
        },
      )
  },
})

export const { limpiarCursoSeleccionado } = cursosSlice.actions
export default cursosSlice.reducer
