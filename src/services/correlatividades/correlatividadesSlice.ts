import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { correlatividadesService } from './correlatividadesService'
import { extraerMensajeError } from '../api/erroresApi'
import { estadoListaInicial, type EstadoLista } from '../api/estadoLista'
import type { CondicionCorrelatividad, CondicionesRegularidad, Correlatividad, CrearCorrelatividad } from '../../types/api'

interface EstadoCorrelatividades extends EstadoLista<CondicionCorrelatividad> {
  asignaturaId: number | null
  solicitudActivaId: string | null
}

const estadoInicial: EstadoCorrelatividades = {
  ...estadoListaInicial<CondicionCorrelatividad>(),
  asignaturaId: null,
  solicitudActivaId: null,
}

export const listarCorrelatividades = createAsyncThunk<CondicionesRegularidad, number, { rejectValue: string }>(
  'correlatividades/listar',
  async (asignaturaId, { rejectWithValue }) => {
    try {
      return await correlatividadesService.listar(asignaturaId)
    } catch (error) {
      return rejectWithValue(extraerMensajeError(error))
    }
  },
)

export const crearCorrelatividad = createAsyncThunk<
  Correlatividad,
  { asignaturaId: number; datos: CrearCorrelatividad },
  { rejectValue: string }
>('correlatividades/crear', async ({ asignaturaId, datos }, { rejectWithValue }) => {
  try {
    return await correlatividadesService.crear(asignaturaId, datos)
  } catch (error) {
    return rejectWithValue(extraerMensajeError(error))
  }
})

const correlatividadesSlice = createSlice({
  name: 'correlatividades',
  initialState: estadoInicial,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(listarCorrelatividades.pending, (state, action) => {
        state.cargando = true
        state.error = null
        state.items = []
        state.asignaturaId = action.meta.arg
        state.solicitudActivaId = action.meta.requestId
      })
      .addCase(listarCorrelatividades.fulfilled, (state, action) => {
        if (state.solicitudActivaId !== action.meta.requestId) return
        state.cargando = false
        state.solicitudActivaId = null
        state.items = action.payload.condiciones
      })
      .addCase(listarCorrelatividades.rejected, (state, action) => {
        if (state.solicitudActivaId !== action.meta.requestId) return
        state.cargando = false
        state.solicitudActivaId = null
        if (action.meta.aborted) return
        state.error = action.payload ?? 'No se pudieron obtener las correlatividades'
      })

      .addCase(crearCorrelatividad.fulfilled, (state, action) => {
        if (state.asignaturaId === action.meta.arg.asignaturaId) state.error = null
      })
      .addCase(crearCorrelatividad.rejected, (state, action) => {
        if (state.asignaturaId !== action.meta.arg.asignaturaId) return
        state.error = action.payload ?? 'No se pudo agregar la correlatividad'
      })
  },
})

export default correlatividadesSlice.reducer
