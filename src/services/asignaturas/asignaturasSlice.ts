import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { asignaturasService } from './asignaturasService'
import { extraerMensajeError } from '../api/erroresApi'
import { estadoListaInicial, type EstadoLista } from '../api/estadoLista'
import type { Asignatura, CrearAsignatura } from '../../types/api'

export const listarAsignaturas = createAsyncThunk<Asignatura[], number, { rejectValue: string }>(
  'asignaturas/listar',
  async (planId, { rejectWithValue }) => {
    try {
      return await asignaturasService.listar(planId)
    } catch (error) {
      return rejectWithValue(extraerMensajeError(error))
    }
  },
)

export const crearAsignatura = createAsyncThunk<
  Asignatura,
  { planId: number; datos: CrearAsignatura },
  { rejectValue: string }
>('asignaturas/crear', async ({ planId, datos }, { rejectWithValue }) => {
  try {
    return await asignaturasService.crear(planId, datos)
  } catch (error) {
    return rejectWithValue(extraerMensajeError(error))
  }
})

const asignaturasSlice = createSlice({
  name: 'asignaturas',
  initialState: estadoListaInicial<Asignatura>(),
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(listarAsignaturas.pending, (state) => {
        state.cargando = true
        state.error = null
      })
      .addCase(
        listarAsignaturas.fulfilled,
        (state: EstadoLista<Asignatura>, action: PayloadAction<Asignatura[]>) => {
          state.cargando = false
          state.items = action.payload
        },
      )
      .addCase(listarAsignaturas.rejected, (state, action) => {
        if (action.meta.aborted) return
        state.cargando = false
        state.error = action.payload ?? 'No se pudieron obtener las asignaturas'
      })

      .addCase(crearAsignatura.fulfilled, (state: EstadoLista<Asignatura>, action: PayloadAction<Asignatura>) => {
        state.items.push(action.payload)
      })
      .addCase(crearAsignatura.rejected, (state, action) => {
        state.error = action.payload ?? 'No se pudo crear la asignatura'
      })
  },
})

export default asignaturasSlice.reducer
