import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { planesEstudioService } from './planesEstudioService'
import { extraerMensajeError } from '../api/erroresApi'
import { estadoListaInicial, type EstadoLista } from '../api/estadoLista'
import type { CrearPlanDeEstudio, PlanDeEstudio } from '../../types/api'

// Lista de planes de la carrera actualmente seleccionada (se reemplaza entera
// al cambiar de carrera y evita mezclar resultados de selecciones anteriores).
export const listarPlanesDeEstudio = createAsyncThunk<PlanDeEstudio[], number, { rejectValue: string }>(
  'planesEstudio/listar',
  async (carreraId, { rejectWithValue }) => {
    try {
      return await planesEstudioService.listar(carreraId)
    } catch (error) {
      return rejectWithValue(extraerMensajeError(error))
    }
  },
)

export const crearPlanDeEstudio = createAsyncThunk<
  PlanDeEstudio,
  { carreraId: number; datos: CrearPlanDeEstudio },
  { rejectValue: string }
>('planesEstudio/crear', async ({ carreraId, datos }, { rejectWithValue }) => {
  try {
    return await planesEstudioService.crear(carreraId, datos)
  } catch (error) {
    return rejectWithValue(extraerMensajeError(error))
  }
})

const planesEstudioSlice = createSlice({
  name: 'planesEstudio',
  initialState: estadoListaInicial<PlanDeEstudio>(),
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(listarPlanesDeEstudio.pending, (state) => {
        state.cargando = true
        state.error = null
      })
      .addCase(
        listarPlanesDeEstudio.fulfilled,
        (state: EstadoLista<PlanDeEstudio>, action: PayloadAction<PlanDeEstudio[]>) => {
          state.cargando = false
          state.items = action.payload
        },
      )
      .addCase(listarPlanesDeEstudio.rejected, (state, action) => {
        state.cargando = false
        state.error = action.payload ?? 'No se pudieron obtener los planes de estudio'
      })

      .addCase(
        crearPlanDeEstudio.fulfilled,
        (state: EstadoLista<PlanDeEstudio>, action: PayloadAction<PlanDeEstudio>) => {
          state.items.push(action.payload)
        },
      )
      .addCase(crearPlanDeEstudio.rejected, (state, action) => {
        state.error = action.payload ?? 'No se pudo crear el plan de estudio'
      })
  },
})

export default planesEstudioSlice.reducer
