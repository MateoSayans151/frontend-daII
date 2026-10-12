# UADEnet - Gestión Académica y Planificación

Frontend del módulo 9 del TPO de Desarrollo de Aplicaciones II.

## Tecnologías

- React
- TypeScript
- Vite

## Inicio local

1. Copiá `.env.example` como `.env`.
2. Ejecutá `npm install`.
3. Ejecutá `npm run dev`.

Configurá `VITE_CORE_URL` con la URL base de CORE (por ejemplo, `https://core`). El portal
inicia sesión en CORE y consume este módulo mediante el gateway
`/api/v1/academic/*`; no se conecta al backend de forma directa. El access token queda sólo
en memoria y el refresh token lo administra CORE en una cookie `HttpOnly`.

## Estructura del frontend

El código está organizado por funcionalidades para que cada integrante pueda trabajar en un módulo sin concentrar toda la lógica en `App.tsx`:

```text
src/
├── app/             navegación y configuración general
├── layouts/         estructuras visuales compartidas
├── components/      componentes reutilizables de interfaz
├── features/        pantallas y lógica de cada módulo
│   ├── academica/
│   ├── planificacion/
│   ├── ciclo/
│   └── dashboard/
├── data/            datos mocks de la demo
├── services/        cliente y servicios de integración con la API
├── types/           tipos TypeScript del dominio
└── App.tsx          orquestación de estado y selección de pantalla
```

Los datos de prueba están en `src/data/mocks.ts`. Cuando conectemos Spring Boot, cada llamada se agregará dentro de `src/services/api/`, sin tener que modificar la estructura visual de las pantallas.

La demo actual persiste los cambios en `localStorage` durante el desarrollo. Se pueden reiniciar limpiando los datos del sitio desde el navegador.

## Flujos mock disponibles

- Carreras, planes y asignaturas: alta, edición, búsqueda, filtro por estado, desactivación y restauración.
- Correlatividades: selección de asignatura, alta y baja de requisitos previos.
- Sedes y aulas: alta de sedes y aulas, edición, control de capacidad y desactivación.
- Asignaciones: alta y edición de horarios con detección de superposiciones por aula.
- Períodos y turnos: alta, edición, filtros y validación de rangos de fechas.
- Regularidad: validación de asistencia mínima del 75 % y promedio mínimo de 6.

## Cursos conectados al backend

En una sesión conectada al backend, la pantalla **Cursos** permite crear y filtrar cursos por período, consultar su detalle, actualizar el estado, asignar docentes, inscribir alumnos, cargar resultados y agregar horarios por aula. Cada curso se crea con `turno` (`TARDE`, `MAÑANA` o `NOCHE`), `horaInicio` y `horaFin` en formato `HH:mm`; esos datos se muestran en el listado y el detalle. Consume `/api/planificacion/cursos` y sus rutas anidadas de docentes, inscripciones y horarios; los errores de validación de capacidad, fechas, sede y superposición se muestran desde la respuesta del backend. El usuario de demostración conserva una vista de cursos de ejemplo local.
