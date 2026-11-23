import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { sedesService } from './sedesService'
import { extraerMensajeError } from '../api/erroresApi'
import { estadoListaInicial, type EstadoLista } from '../api/estadoLista'
import type { ResumenSincronizacionBackoffice, Sede } from '../../types/api'

export const listarSedes = createAsyncThunk<Sede[], void, { rejectValue: string }>(
  'sedes/listar',
  async (_, { rejectWithValue }) => {
    try {
      return await sedesService.listar()
    } catch (error) {
      return rejectWithValue(extraerMensajeError(error))
    }
  },
)

// Fuerza la lectura del catálogo de Backoffice y vuelve a listar las sedes actualizadas.
export const sincronizarSedes = createAsyncThunk<ResumenSincronizacionBackoffice, void, { rejectValue: string }>(
  'sedes/sincronizar',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const resumen = await sedesService.sincronizar()
      await dispatch(listarSedes())
      return resumen
    } catch (error) {
      return rejectWithValue(extraerMensajeError(error))
    }
  },
)

const sedesSlice = createSlice({
  name: 'sedes',
  initialState: estadoListaInicial<Sede>(),
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(listarSedes.pending, (state) => {
        state.cargando = true
        state.error = null
      })
      .addCase(listarSedes.fulfilled, (state: EstadoLista<Sede>, action: PayloadAction<Sede[]>) => {
        state.cargando = false
        state.items = action.payload
      })
      .addCase(listarSedes.rejected, (state, action) => {
        state.cargando = false
        state.error = action.payload ?? 'No se pudieron obtener las sedes'
      })
      .addCase(sincronizarSedes.rejected, (state, action) => {
        state.error = action.payload ?? 'No se pudo sincronizar con Backoffice'
      })
  },
})

export default sedesSlice.reducer
