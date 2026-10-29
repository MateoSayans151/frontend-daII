import { isAxiosError } from 'axios'

interface CuerpoErrorApi {
  mensaje?: string
  detail?: string
  message?: string
  errores?: Record<string, string | string[]>
  errors?: Record<string, string | string[]>
}

/**
 * Traduce tanto application/problem+json como el formato legado a un mensaje visible.
 */
export function extraerMensajeError(
  error: unknown,
  mensajePorDefecto = 'No se pudo completar la solicitud. Volvé a intentarlo.',
): string {
  if (isAxiosError<CuerpoErrorApi | string>(error)) {
    const { response, code } = error
    const estado = response?.status

    const cuerpo = response?.data
    const mensajeServidor = typeof cuerpo === 'string'
      ? cuerpo.trim()
      : cuerpo?.detail ?? cuerpo?.mensaje ?? cuerpo?.message
    const errores = typeof cuerpo === 'object' && cuerpo !== null
      ? cuerpo.errors ?? cuerpo.errores
      : undefined
    const detalles = errores
      ? Object.entries(errores)
        .flatMap(([campo, detalleCampo]) => {
          const valores = Array.isArray(detalleCampo) ? detalleCampo : [detalleCampo]
          const nombreCampo = campo.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
          return valores.map((detalle) => `${nombreCampo}: ${detalle}`)
        })
        .join('; ')
      : ''

    if (mensajeServidor && mensajeServidor.length < 500) {
      const mensajeGenerico = ['bad request', 'not found', 'internal server error', 'no message available', 'unauthorized', 'forbidden']
      const esMensajeGenerico = mensajeGenerico.includes(mensajeServidor.toLowerCase())
      if (!esMensajeGenerico) return detalles ? `${mensajeServidor}. ${detalles}` : mensajeServidor
    }

    if (detalles) return detalles

    if (code === 'ECONNABORTED' || code === 'ETIMEDOUT' || estado === 408 || estado === 504) {
      return 'La API tardó demasiado en responder. Revisá la conexión y volvé a intentar.'
    }
    if (estado === 401) return 'Tu sesión venció o no está activa. Volvé a iniciar sesión.'
    if (estado === 403) return 'Tu cuenta no tiene permiso para realizar esta acción.'
    if (estado === 404) return 'No encontramos el recurso solicitado. Actualizá la lista y volvé a intentarlo.'
    if (estado === 409) return 'El registro ya existe o cambió mientras trabajabas. Actualizá la lista y revisá los datos antes de reintentar.'
    if (estado === 400 || estado === 422) return 'La API no pudo validar los datos enviados. Revisá los campos e intentá de nuevo.'
    if (estado === 413) return 'El contenido enviado supera el tamaño permitido.'
    if (estado === 429) return 'Se recibieron demasiadas solicitudes. Esperá un momento y volvé a intentar.'
    if (estado && estado >= 500) {
      return `El servidor tuvo un problema al procesar la solicitud (HTTP ${estado}). Volvé a intentar; si persiste, compartí este código con soporte.`
    }
    if (estado) return `La API respondió con HTTP ${estado}. Revisá la solicitud y volvé a intentar.`
    if (!response) return 'No pudimos conectar con el servicio académico. Si estás trabajando en local, verificá que Spring Boot esté iniciado y volvé a intentar.'
  }
  return mensajePorDefecto
}
