import { isAxiosError } from 'axios'

interface CuerpoErrorApi {
  mensaje?: string
  detail?: string
  errores?: Record<string, string>
  errors?: Record<string, string>
}

/**
 * Traduce tanto application/problem+json como el formato legado a un mensaje visible.
 */
export function extraerMensajeError(
  error: unknown,
  mensajePorDefecto = 'Ocurrio un error al comunicarse con el servidor',
): string {
  if (isAxiosError<CuerpoErrorApi>(error)) {
    const metodo = error.config?.method?.toUpperCase()
    const ruta = error.config?.url
    const estado = error.response?.status
    const contexto = estado
      ? ` (HTTP ${estado}${metodo && ruta ? ` · ${metodo} ${ruta}` : ''})`
      : metodo && ruta ? ` (${metodo} ${ruta})` : ''

    const mensajeApi = error.response?.data?.detail ?? error.response?.data?.mensaje
    if (mensajeApi) {
      const errores = error.response?.data?.errors ?? error.response?.data?.errores
      const detalles = errores
        ? Object.entries(errores).map(([campo, detalleCampo]) => `${campo}: ${detalleCampo}`).join('; ')
        : ''
      return `${detalles ? `${mensajeApi}. ${detalles}` : mensajeApi}${contexto}`
    }
    if (estado === 401) return `Debes iniciar sesion para continuar${contexto}`
    if (estado === 403) return `No tenes permisos para realizar esta accion${contexto}`
    if (!error.response) return `No se pudo conectar con el servidor${contexto}`
  }
  return mensajePorDefecto
}
