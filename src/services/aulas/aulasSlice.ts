import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { aulasService } from './aulasService'
import { extraerMensajeError } from '../api/erroresApi'
import { estadoListaInicial, type EstadoLista } from '../api/estadoLista'
import type { Aula } from '../../types/api'

export const listarAulas = createAsyncThunk<Aula[], number, { rejectValue: string }>(
  'aulas/listar',
  async (sedeId, { rejectWithValue }) => {
    try {
      return await aulasService.listar(sedeId)
    } catch (error) {
      return rejectWithValue(extraerMensajeError(error))
    }
  },
)

const aulasSlice = createSlice({
  name: 'aulas',
  initialState: estadoListaInicial<Aula>(),
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(listarAulas.pending, (state) => {
        state.cargando = true
        state.error = null
      })
      .addCase(listarAulas.fulfilled, (state: EstadoLista<Aula>, action: PayloadAction<Aula[]>) => {
        state.cargando = false
        state.items = action.payload
      })
      .addCase(listarAulas.rejected, (state, action) => {
        state.cargando = false
        state.error = action.payload ?? 'No se pudieron obtener las aulas'
      })
  },
})

export default aulasSlice.reducer
