import { isAxiosError } from 'axios'

interface CuerpoErrorApi {
  mensaje?: string
  errores?: Record<string, string>
}

/**
 * El backend (ManejadorErrores) devuelve { mensaje, errores? } para los errores
 * de negocio y de validacion. Esta funcion lo traduce a un string listo para
 * mostrarle al usuario, con mensajes propios para los casos que no traen body.
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

    if (error.response?.data?.mensaje) {
      const { mensaje, errores } = error.response.data
      const detalles = errores
        ? Object.entries(errores).map(([campo, detalle]) => `${campo}: ${detalle}`).join('; ')
        : ''
      return `${detalles ? `${mensaje}. ${detalles}` : mensaje}${contexto}`
    }
    if (estado === 401) return `Debes iniciar sesion para continuar${contexto}`
    if (estado === 403) return `No tenes permisos para realizar esta accion${contexto}`
    if (!error.response) return `No se pudo conectar con el servidor${contexto}`
  }
  return mensajePorDefecto
}
