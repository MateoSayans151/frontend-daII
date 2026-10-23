import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { isAxiosError } from 'axios'
import { usuariosService } from './usuariosService'
import { extraerMensajeError } from '../api/erroresApi'
import type { LoginUsuario, Usuario } from '../../types/api'

interface EstadoUsuario {
  actual: Usuario | null
  verificandoSesion: boolean
  cargando: boolean
  error: string | null
}

const estadoInicial: EstadoUsuario = {
  actual: null,
  verificandoSesion: true,
  cargando: false,
  error: null,
}

export const iniciarSesion = createAsyncThunk<Usuario, LoginUsuario, { rejectValue: string }>(
  'usuarios/iniciarSesion',
  async (datos, { rejectWithValue }) => {
    try {
      return await usuariosService.login(datos)
    } catch (error) {
      if (isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) {
        return rejectWithValue('El email o la contraseña son incorrectos.')
      }
      return rejectWithValue(extraerMensajeError(error, 'Email o contrasena incorrectos'))
    }
  },
)

export const cerrarSesion = createAsyncThunk<void, void, { rejectValue: string }>(
  'usuarios/cerrarSesion',
  async (_, { rejectWithValue }) => {
    try {
      await usuariosService.logout()
    } catch (error) {
      return rejectWithValue(extraerMensajeError(error))
    }
  },
)

// Se dispara una vez al arrancar la app (ver app/store.ts) para saber si la
// cookie de sesion que ya tiene el navegador todavia es valida, sin pedirle
// al usuario que vuelva a loguearse en cada recarga de pagina.
export const obtenerUsuarioActual = createAsyncThunk<Usuario, void, { rejectValue: string }>(
  'usuarios/obtenerActual',
  async (_, { rejectWithValue }) => {
    try {
      return await usuariosService.actual()
    } catch (error) {
      return rejectWithValue(extraerMensajeError(error))
    }
  },
)

const usuariosSlice = createSlice({
  name: 'usuarios',
  initialState: estadoInicial,
  reducers: {
    limpiarErrorUsuario: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(iniciarSesion.pending, (state) => {
        state.cargando = true
        state.error = null
      })
      .addCase(iniciarSesion.fulfilled, (state, action: PayloadAction<Usuario>) => {
        state.cargando = false
        state.actual = action.payload
      })
      .addCase(iniciarSesion.rejected, (state, action) => {
        state.cargando = false
        state.error = action.payload ?? 'No se pudo iniciar sesion'
      })

      .addCase(cerrarSesion.fulfilled, (state) => {
        state.actual = null
      })

      .addCase(obtenerUsuarioActual.pending, (state) => {
        state.verificandoSesion = true
      })
      .addCase(obtenerUsuarioActual.fulfilled, (state, action: PayloadAction<Usuario>) => {
        state.verificandoSesion = false
        state.actual = action.payload
      })
      .addCase(obtenerUsuarioActual.rejected, (state) => {
        // No habia sesion activa (401) o fallo la consulta: seguimos como no
        // logueados, sin mostrar esto como un error visible al usuario.
        state.verificandoSesion = false
        state.actual = null
      })
  },
})

export const { limpiarErrorUsuario } = usuariosSlice.actions
export default usuariosSlice.reducer
