import { authAxios } from '../api/authAxios'
import type { LoginUsuario, Usuario } from '../../types/api'

export const usuariosService = {
  login: (datos: LoginUsuario) => authAxios.post<Usuario>('/api/auth/login', datos).then((r) => r.data),
  logout: () => authAxios.post<void>('/api/auth/logout'),
  actual: () => authAxios.get<Usuario>('/api/auth/me').then((r) => r.data),
}
