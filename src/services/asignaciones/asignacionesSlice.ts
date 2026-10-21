import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { asignacionesService } from './asignacionesService'
import { extraerMensajeError } from '../api/erroresApi'
import type { Asignacion, CrearAsignacion } from '../../types/api'

interface EstadoAsignaciones {
  items: Asignacion[]
  agenda: Asignacion[]
  cargandoLista: boolean
  cargandoAgenda: boolean
  creando: boolean
  errorLista: string | null
  errorAgenda: string | null
  errorCreacion: string | null
  solicitudLista: string | null
  solicitudAgenda: string | null
}

const estadoInicial: EstadoAsignaciones = {
  items: [], agenda: [], cargandoLista: false, cargandoAgenda: false, creando: false,
  errorLista: null, errorAgenda: null, errorCreacion: null, solicitudLista: null, solicitudAgenda: null,
}

export const listarAsignaciones = createAsyncThunk<Asignacion[], void, { rejectValue: string }>(
  'asignaciones/listar', async (_, { rejectWithValue }) => {
    try {
      return await asignacionesService.listar()
    } catch (error) {
      return rejectWithValue(extraerMensajeError(error))
    }
  },
)

export const obtenerAgendaAsignatura = createAsyncThunk<
  Asignacion[], { asignaturaId: number; desde: string; hasta: string }, { rejectValue: string }
>('asignaciones/agendaAsignatura', async ({ asignaturaId, desde, hasta }, { rejectWithValue }) => {
  try {
    return await asignacionesService.agendaAsignatura(asignaturaId, desde, hasta)
  } catch (error) {
    return rejectWithValue(extraerMensajeError(error))
  }
})

export const crearAsignacion = createAsyncThunk<Asignacion, CrearAsignacion, { rejectValue: string }>(
  'asignaciones/crear', async (datos, { rejectWithValue }) => {
    try {
      return await asignacionesService.crear(datos)
    } catch (error) {
      return rejectWithValue(extraerMensajeError(error))
    }
  },
)

const asignacionesSlice = createSlice({
  name: 'asignaciones',
  initialState: estadoInicial,
  reducers: {
    limpiarAgenda(state) {
      state.agenda = []
      state.errorAgenda = null
      state.cargandoAgenda = false
      state.solicitudAgenda = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listarAsignaciones.pending, (state, action) => {
        state.cargandoLista = true
        state.errorLista = null
        state.solicitudLista = action.meta.requestId
      })
      .addCase(listarAsignaciones.fulfilled, (state, action) => {
        if (state.solicitudLista !== action.meta.requestId) return
        state.cargandoLista = false
        state.items = action.payload
        state.solicitudLista = null
      })
      .addCase(listarAsignaciones.rejected, (state, action) => {
        if (state.solicitudLista !== action.meta.requestId) return
        state.cargandoLista = false
        state.errorLista = action.payload ?? 'No se pudieron cargar las asignaciones'
        state.solicitudLista = null
      })
      .addCase(obtenerAgendaAsignatura.pending, (state, action) => {
        state.cargandoAgenda = true
        state.errorAgenda = null
        state.agenda = []
        state.solicitudAgenda = action.meta.requestId
      })
      .addCase(obtenerAgendaAsignatura.fulfilled, (state, action) => {
        if (state.solicitudAgenda !== action.meta.requestId) return
        state.cargandoAgenda = false
        state.agenda = action.payload
        state.solicitudAgenda = null
      })
      .addCase(obtenerAgendaAsignatura.rejected, (state, action) => {
        if (state.solicitudAgenda !== action.meta.requestId) return
        state.cargandoAgenda = false
        state.errorAgenda = action.payload ?? 'No se pudo obtener la agenda'
        state.solicitudAgenda = null
      })
      .addCase(crearAsignacion.pending, (state) => {
        state.creando = true
        state.errorCreacion = null
      })
      .addCase(crearAsignacion.fulfilled, (state, action) => {
        state.creando = false
        state.items.push(action.payload)
        state.items.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio))
      })
      .addCase(crearAsignacion.rejected, (state, action) => {
        state.creando = false
        state.errorCreacion = action.payload ?? 'No se pudo crear la asignación'
      })
  },
})

export const { limpiarAgenda } = asignacionesSlice.actions
export default asignacionesSlice.reducer
