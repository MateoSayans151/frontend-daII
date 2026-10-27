# UADEnet - Gestión Académica y Planificación

Frontend React, TypeScript y Vite del módulo de Gestión Académica.

## Estado actual

Todas las pantallas activas consumen el backend. El modo demo, los datos de ejemplo en
`localStorage` y las pantallas mock fueron eliminados. Una autenticación exitosa siempre
abre `AppReal` y las altas, consultas y modificaciones se realizan mediante los servicios
HTTP de `src/services`.

La autenticación disponible hoy es la sesión local del backend:

- `POST /api/auth/login` crea la sesión;
- `GET /api/auth/me` reconstruye la sesión al recargar;
- `POST /api/auth/logout` la invalida;
- Axios envía la cookie `JSESSIONID` con `withCredentials`.

No hay llamadas desde el frontend a rutas inexistentes como `/api/usuarios`.

## Inicio local

1. Copiar `.env.example` como `.env`.
2. Configurar `VITE_API_URL=http://localhost:8080`.
3. Ejecutar `npm install`.
4. Ejecutar `npm run dev`.

```powershell
npm.cmd run dev
```

## Pantallas conectadas

| Sección | API utilizada |
| --- | --- |
| Carreras | `/api/academica/carreras` |
| Planes | `/api/academica/carreras/{id}/planes` y `/api/academica/planes/{id}/pdf` |
| Asignaturas | `/api/academica/planes/{id}/asignaturas` |
| Correlatividades | `/api/academica/asignaturas/{id}/correlatividades`; devuelve condiciones agrupadas por tipo y cada materia correlativa con ID, código y nombre |
| Sedes y aulas | `/api/planificacion/sedes` y rutas de aulas por sede |
| Cursos | `/api/planificacion/cursos`, horario y consultas `/cursos/{id}/docentes` y `/cursos/{id}/alumnos` |
| Asignaciones | `/api/planificacion/asignaciones` |
| Agenda | `/api/planificacion/aulas/{id}/agenda?desde=&hasta=` |
| Períodos | `/api/planificacion/periodos` |
| Turnos | `/api/planificacion/turnos-examen` |
| Regularidad | `/api/regularidad/validar` |

La agenda selecciona un aula, consulta un rango de 42 días para cubrir el mes visible y
muestra las reservas del día elegido.

En la edición de un curso, docentes y alumnos son secciones de consulta. El frontend
obtiene ambas listas mediante sus endpoints `GET` y no muestra formularios de alta,
inscripción ni modificación de resultados en esa pantalla.

La pantalla de correlatividades cancela las consultas anteriores al cambiar de
asignatura, ignora respuestas tardías y no ofrece materias que ya están configuradas.

## Estructura

```text
src/
├── app/             store, hooks y navegación
├── components/      componentes reutilizables
├── features/real/   pantallas conectadas al backend
├── layouts/         estructura general de la aplicación
├── services/        cliente Axios, servicios y slices de Redux
├── types/           contratos TypeScript de la API
└── App.tsx          autenticación y entrada a la aplicación real
```

## Integración con CORE

El frontend todavía no usa el login ni el gateway de CORE. No debe configurarse una URL
ficticia para simular esa integración. La migración requiere primero que CORE publique
el módulo y confirme el mapeo de rutas, JWT, permisos y ambientes.

Los pedidos necesarios y las brechas comprobadas están en
[`INTEGRACION_CORE.md`](../Backend/Backend/docs/INTEGRACION_CORE.md).

## Verificación

```powershell
npm.cmd run lint
npm.cmd run build
```
