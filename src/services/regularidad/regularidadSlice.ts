import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { regularidadService } from './regularidadService'
import { extraerMensajeError } from '../api/erroresApi'
import type { CondicionesRegularidadCurso } from '../../types/api'

interface EstadoRegularidad {
  resultado: CondicionesRegularidadCurso | null
  cargando: boolean
  error: string | null
  solicitudActivaId: string | null
}

const estadoInicial: EstadoRegularidad = {
  resultado: null,
  cargando: false,
  error: null,
  solicitudActivaId: null,
}

export const consultarRegularidad = createAsyncThunk<
  CondicionesRegularidadCurso,
  number,
  { rejectValue: string }
>('regularidad/consultar', async (cursoId, { rejectWithValue }) => {
  try {
    return await regularidadService.consultar(cursoId)
  } catch (error) {
    return rejectWithValue(extraerMensajeError(error))
  }
})

const regularidadSlice = createSlice({
  name: 'regularidad',
  initialState: estadoInicial,
  reducers: {
    limpiarResultadoRegularidad: (state) => {
      state.resultado = null
      state.error = null
      state.solicitudActivaId = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(consultarRegularidad.pending, (state, action) => {
        state.cargando = true
        state.error = null
        state.resultado = null
        state.solicitudActivaId = action.meta.requestId
      })
      .addCase(consultarRegularidad.fulfilled, (state, action: PayloadAction<CondicionesRegularidadCurso> & { meta: { requestId: string } }) => {
        if (state.solicitudActivaId !== action.meta.requestId) return
        state.cargando = false
        state.solicitudActivaId = null
        state.resultado = action.payload
      })
      .addCase(consultarRegularidad.rejected, (state, action) => {
        if (state.solicitudActivaId !== action.meta.requestId) return
        state.cargando = false
        state.solicitudActivaId = null
        state.error = action.payload ?? 'No se pudieron obtener las condiciones de regularidad'
      })
  },
})

export const { limpiarResultadoRegularidad } = regularidadSlice.actions
export default regularidadSlice.reducer
