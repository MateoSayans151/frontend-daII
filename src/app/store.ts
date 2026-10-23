import { configureStore } from '@reduxjs/toolkit'
import usuariosReducer, { obtenerUsuarioActual } from '../services/usuarios/usuariosSlice'
import carrerasReducer from '../services/carreras/carrerasSlice'
import planesEstudioReducer from '../services/planesEstudio/planesEstudioSlice'
import asignaturasReducer from '../services/asignaturas/asignaturasSlice'
import correlatividadesReducer from '../services/correlatividades/correlatividadesSlice'
import sedesReducer from '../services/sedes/sedesSlice'
import aulasReducer from '../services/aulas/aulasSlice'
import asignacionesReducer from '../services/asignaciones/asignacionesSlice'
import cursosReducer from '../services/cursos/cursosSlice'
import periodosReducer from '../services/periodos/periodosSlice'
import turnosExamenReducer from '../services/turnosExamen/turnosExamenSlice'
import regularidadReducer from '../services/regularidad/regularidadSlice'

export const store = configureStore({
  reducer: {
    usuarios: usuariosReducer,
    carreras: carrerasReducer,
    planesEstudio: planesEstudioReducer,
    asignaturas: asignaturasReducer,
    correlatividades: correlatividadesReducer,
    sedes: sedesReducer,
    aulas: aulasReducer,
    asignaciones: asignacionesReducer,
    cursos: cursosReducer,
    periodos: periodosReducer,
    turnosExamen: turnosExamenReducer,
    regularidad: regularidadReducer,
  },
})

// Reconstruye la sesión local a partir de la cookie HttpOnly JSESSIONID.
store.dispatch(obtenerUsuarioActual())

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
