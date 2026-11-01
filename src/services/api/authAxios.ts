import axios, { isAxiosError } from 'axios'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export const authAxios = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

let alExpirarSesion: (() => void) | null = null

// El store se registra acá para que el cliente HTTP no dependa de él.
export function registrarSesionExpirada(accion: () => void) {
  alExpirarSesion = accion
}

authAxios.interceptors.response.use(undefined, (error) => {
  const esAutenticacion = isAxiosError(error) && error.config?.url?.startsWith('/api/auth/')
  if (isAxiosError(error) && error.response?.status === 401 && !esAutenticacion) alExpirarSesion?.()
  return Promise.reject(error)
})
