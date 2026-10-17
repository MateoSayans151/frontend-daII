import { Check, X } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { CalendarDatePicker } from './ui/CalendarDatePicker'
import { MockTag } from './ui/MockTag'
import type { ModalKind, ModalTarget } from '../types/domain'
import {
  CODIGO_ACADEMICO_MENSAJE,
  esCodigoAcademicoValido,
  normalizarCodigoAcademico,
} from '../utils/codigoAcademico'

export type ModalValues = Record<string, string>

type ModalProps = {
  target: ModalTarget
  initialValues?: ModalValues
  close: () => void
  onSave: (values: ModalValues) => string | undefined
}

type Field = { name: string; label: string; placeholder: string; type?: string; min?: string; max?: string; step?: string }

const opcionesAnio = [1, 2, 3, 4, 5]

const fieldMap: Record<ModalKind, Field[]> = {
  career: [
    { name: 'name', label: 'Nombre de la carrera', placeholder: 'Ej. Ingeniería en Informática' },
    { name: 'title', label: 'Título que otorga', placeholder: 'Ej. Ingeniero/a en Informática' },
    { name: 'faculty', label: 'Facultad', placeholder: 'Ej. Facultad de Ingeniería' },
    { name: 'duration', label: 'Duración', placeholder: 'Ej. 5 años' },
    { name: 'code', label: 'Código', placeholder: 'Ej. ARQ-001' },
  ],
  plan: [
    { name: 'name', label: 'Nombre del plan', placeholder: 'Ej. Plan de estudio 2026' },
    { name: 'career', label: 'Carrera', placeholder: 'Ej. Ingeniería en Informática' },
    { name: 'validFrom', label: 'Vigente desde', placeholder: 'Ej. Marzo 2026' },
    { name: 'subjectsCount', label: 'Cantidad de asignaturas', placeholder: 'Ej. 42', type: 'number', min: '1', max: '200' },
    { name: 'code', label: 'Código', placeholder: 'Ej. ARQ-001' },
  ],
  subject: [
    { name: 'name', label: 'Nombre de la asignatura', placeholder: 'Ej. Desarrollo de Aplicaciones II' },
    { name: 'code', label: 'Código', placeholder: 'Ej. ARQ1-001' },
    { name: 'career', label: 'Carrera', placeholder: 'Ej. Ingeniería en Informática' },
    { name: 'plan', label: 'Plan de estudio', placeholder: 'Ej. Plan 2026' },
    { name: 'year', label: 'Año / nivel', placeholder: 'Ej. 3.º año' },
    { name: 'credits', label: 'Créditos', placeholder: 'Ej. 6', type: 'number', min: '1', max: '30' },
  ],
  campus: [
    { name: 'name', label: 'Nombre de la sede', placeholder: 'Ej. Monserrat' },
  ],
  room: [
    { name: 'name', label: 'Nombre del aula', placeholder: 'Ej. Aula 204' },
    { name: 'campus', label: 'Sede', placeholder: 'Ej. Monserrat' },
    { name: 'type', label: 'Tipo de espacio', placeholder: 'Ej. Aula teórica' },
    { name: 'capacity', label: 'Capacidad máxima', placeholder: 'Ej. 42', type: 'number', min: '1', max: '1000' },
  ],
  assignment: [
    { name: 'course', label: 'Asignatura', placeholder: 'Ej. Desarrollo de Aplicaciones II' },
    { name: 'room', label: 'Aula', placeholder: 'Ej. Lab. Informática 3' },
    { name: 'day', label: 'Día', placeholder: 'Ej. Lunes' },
    { name: 'start', label: 'Hora de inicio', placeholder: '08:00', type: 'time' },
    { name: 'end', label: 'Hora de fin', placeholder: '10:00', type: 'time' },
  ],
  period: [
    { name: 'name', label: 'Nombre del período', placeholder: 'Ej. 2.º cuatrimestre 2026' },
    { name: 'start', label: 'Fecha de inicio', placeholder: 'Seleccioná una fecha', type: 'date' },
    { name: 'end', label: 'Fecha de finalización', placeholder: 'Seleccioná una fecha', type: 'date' },
  ],
  exam: [
    { name: 'name', label: 'Nombre del turno', placeholder: 'Ej. Turno febrero 2027' },
    { name: 'start', label: 'Fecha de inicio', placeholder: 'Seleccioná una fecha', type: 'date' },
    { name: 'end', label: 'Fecha de finalización', placeholder: 'Seleccioná una fecha', type: 'date' },
  ],
}

const titles: Record<ModalKind, { noun: string; create: string }> = {
  career: { noun: 'carrera', create: 'Nueva carrera' },
  plan: { noun: 'plan de estudio', create: 'Nuevo plan de estudio' },
  subject: { noun: 'asignatura', create: 'Nueva asignatura' },
  campus: { noun: 'sede', create: 'Nueva sede' },
  room: { noun: 'aula', create: 'Nueva aula' },
  assignment: { noun: 'asignación', create: 'Nueva asignación' },
  period: { noun: 'período académico', create: 'Nuevo período académico' },
  exam: { noun: 'turno de examen', create: 'Nuevo turno de examen' },
}

function validate(values: ModalValues, fields: Field[]) {
  const errors: Record<string, string> = {}
  fields.forEach((field) => {
    if (!values[field.name]?.trim()) errors[field.name] = 'Este campo es obligatorio.'
    if (field.name === 'code' && values[field.name] && !esCodigoAcademicoValido(values[field.name])) {
      errors[field.name] = CODIGO_ACADEMICO_MENSAJE
    }
    if (field.type === 'number' && values[field.name]) {
      const number = Number(values[field.name])
      if (!Number.isFinite(number) || number < Number(field.min) || number > Number(field.max)) errors[field.name] = `Ingresá un valor entre ${field.min} y ${field.max}.`
    }
  })
  if (values.start && values.end && values.start >= values.end) errors.end = 'Debe ser posterior al inicio.'
  return errors
}

export function Modal({ target, initialValues = {}, close, onSave }: ModalProps) {
  const fields = fieldMap[target.kind]
  const [values, setValues] = useState<ModalValues>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const title = target.id ? `Editar ${titles[target.kind].noun}` : titles[target.kind].create

  const update = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: name === 'code' ? normalizarCodigoAcademico(value) : value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setSubmitError('')
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = validate(values, fields)
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors)
      setSubmitError('Revisá los campos marcados antes de guardar.')
      return
    }
    const error = onSave(values)
    if (error) {
      setSubmitError(error)
      return
    }
    close()
  }

  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}><form className="modal" onSubmit={submit} noValidate><div className="modal-head"><div><span className="form-kicker">{target.id ? 'EDITAR REGISTRO' : 'CREAR REGISTRO'} <MockTag /></span><h2>{title}</h2></div><button type="button" onClick={close} aria-label="Cerrar"><X size={20} /></button></div>{submitError && <div className="form-error summary" role="alert">{submitError}</div>}{fields.map((field) => field.name === 'year' ? <label key={field.name}>{field.label}<select value={values[field.name] ?? ''} onChange={(event) => update(field.name, event.target.value)} aria-invalid={Boolean(errors[field.name])}><option value="">Seleccioná el año</option>{opcionesAnio.map((anio) => <option key={anio} value={String(anio)}>{anio}</option>)}</select>{errors[field.name] && <small className="field-error">{errors[field.name]}</small>}</label> : field.type === 'date' ? <div className="modal-date-field" key={field.name}><CalendarDatePicker label={field.label} value={values[field.name] ?? ''} onChange={(value) => update(field.name, value)} placeholder={field.placeholder} />{errors[field.name] && <small className="field-error">{errors[field.name]}</small>}</div> : <label key={field.name}>{field.label}<input value={values[field.name] ?? ''} onChange={(event) => update(field.name, event.target.value)} type={field.type ?? 'text'} min={field.min} max={field.max} step={field.step} placeholder={field.placeholder} autoFocus={field === fields[0]} aria-invalid={Boolean(errors[field.name])} />{errors[field.name] && <small className="field-error">{errors[field.name]}</small>}</label>)}<label>Descripción<textarea rows={3} placeholder="Información adicional (opcional)" /></label><div className="modal-actions"><button className="secondary-button" type="button" onClick={close}>Cancelar</button><button className="primary-button" type="submit"><Check size={17} /> {target.id ? 'Guardar cambios' : 'Guardar mock'}</button></div></form></div>
}
