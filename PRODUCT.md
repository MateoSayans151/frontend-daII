# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + TypeScript + Vite, conectado a la API REST del backend Spring Boot mediante Axios y Redux Toolkit.

## Users

Personal administrativo de la Secretaría Académica de la universidad. Su tarea es mantener la estructura educativa y organizar la cursada y los exámenes.

## Product Purpose

UADEnet centraliza la gestión académica y la planificación institucional: carreras, planes de estudio, asignaturas, correlatividades, aulas, períodos y turnos de examen. El éxito consiste en que el equipo pueda consultar, crear y revisar esa información sin depender de planillas dispersas.

## Positioning

Un único espacio de trabajo conecta la estructura académica con su planificación operativa y muestra las validaciones que afectan la inscripción a finales.

## Operating Context

El portal se usa desde computadoras del equipo administrativo. Las pantallas trabajan con datos persistidos por el backend. En desarrollo se usa autenticación local por sesión; la autenticación y el gateway de CORE siguen pendientes de coordinación.

## Capabilities and Constraints

- Gestionar carreras, planes de estudio, asignaturas y correlatividades.
- Crear sedes y aulas, registrar capacidades y consultar agendas.
- Asignar aulas a cursos evitando superposiciones horarias.
- Definir fechas de inicio y fin de cuatrimestres y turnos de exámenes finales.
- Validar regularidad a partir de asistencia mínima y promedio mínimo.
- La API local usa una sesión HTTP con cookie `JSESSIONID` y restringe la administración a roles académicos.
- La UI debe conservar los textos en español y mostrar claramente errores, estados vacíos y cargas provenientes de la API.

## Brand Commitments

El producto se llama UADEnet. La interfaz está dirigida a un entorno universitario serio, claro y operativo.

## Evidence on Hand

- Consigna del TPO: `/Users/macbookair/Downloads/TPO - DEA II 2Q 2026 (1).pdf`.
- Lineamientos visuales consolidados en los componentes y estilos del repositorio.
- Backend documentado por el usuario con endpoints REST en `http://localhost:8080`.
- Contrato y pedidos pendientes de CORE en `../Backend/Backend/docs/INTEGRACION_CORE.md`.

## Product Principles

- Claridad antes que densidad: cada pantalla debe responder qué se puede hacer y cuál es el siguiente paso.
- Una fuente de verdad: la estructura académica y la planificación se consultan desde el mismo espacio.
- Validaciones visibles: los conflictos y requisitos deben aparecer antes de confirmar una operación.
- Fuente de datos verificable: toda pantalla operativa debe consumir un endpoint implementado y mostrar sus fallos sin sustituirlos por datos locales.

## Accessibility & Inclusion

Usar HTML semántico, navegación completa por teclado, foco visible, contraste WCAG AA y alternativas textuales para iconos. La interfaz debe funcionar en desktop y adaptarse a pantallas angostas.
