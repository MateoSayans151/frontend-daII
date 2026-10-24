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
    const estado = error.response?.status

    const mensajeApi = error.response?.data?.detail ?? error.response?.data?.mensaje
    if (mensajeApi) {
      const errores = error.response?.data?.errors ?? error.response?.data?.errores
      const detalles = errores
        ? Object.entries(errores).map(([campo, detalleCampo]) => `${campo}: ${detalleCampo}`).join('; ')
        : ''
      return detalles ? `${mensajeApi}. ${detalles}` : mensajeApi
    }
    if (estado === 401) return 'Debes iniciar sesion para continuar'
    if (estado === 403) return 'No tenes permisos para realizar esta accion'
    if (!error.response) return 'No se pudo conectar con el servidor'
  }
  return mensajePorDefecto
}
