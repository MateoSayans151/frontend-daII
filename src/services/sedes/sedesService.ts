import { authAxios } from '../api/authAxios'
import type { ResumenSincronizacionBackoffice, Sede } from '../../types/api'

const BASE = '/api/v1/planificacion/sedes'

// El catálogo de sedes es de Backoffice (G8): sólo se muestran las sedes vinculadas a un
// siteId. Las sedes locales sin vínculo son datos de prueba y no se ofrecen.
export const sedesService = {
  listar: () => authAxios.get<Sede[]>(BASE).then((r) => r.data.filter((sede) => sede.backofficeSiteId)),
  sincronizar: () =>
    authAxios.post<ResumenSincronizacionBackoffice>(`${BASE}/sincronizar`).then((r) => r.data),
}
