import { Check, X } from '@phosphor-icons/react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { CalendarDatePicker } from './ui/CalendarDatePicker'
import { MockTag } from './ui/MockTag'
import type { ModalKind, ModalTarget } from '../types/domain'
import type { Campus, Career, Room, StudyPlan, Subject } from '../types/domain'
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
  catalogs: {
    careers: Career[]
    plans: StudyPlan[]
    subjects: Subject[]
    campuses: Campus[]
    rooms: Room[]
  }
}

type CatalogKey = 'careers' | 'plans' | 'subjects' | 'campuses' | 'rooms' | 'days'
type Field = { name: string; label: string; placeholder: string; type?: string; min?: string; max?: string; step?: string; optionsKey?: CatalogKey }
type FieldOption = { value: string; label: string }

const opcionesAnio = [1, 2, 3, 4, 5]
const opcionesDias: FieldOption[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  .map((dia) => ({ value: dia, label: dia }))

const fieldMap: Record<ModalKind, Field[]> = {
  career: [
    { name: 'name', label: 'Nombre de la carrera', placeholder: 'Ej. Ingeniería en Informática' },
    { name: 'title', label: 'Título que otorga', placeholder: 'Ej. Ingeniero/a en Informática' },
    { name: 'faculty', label: 'Facultad', placeholder: 'Ej. Facultad de Ingeniería' },
    { name: 'duration', label: 'Duración (años)', placeholder: 'Ej. 5', type: 'number', min: '1', max: '15', step: '1' },
    { name: 'code', label: 'Código', placeholder: 'Ej. ARQ-001' },
  ],
  plan: [
    { name: 'name', label: 'Nombre del plan', placeholder: 'Ej. Plan de estudio 2026' },
    { name: 'career', label: 'Carrera', placeholder: 'Seleccioná una carrera', optionsKey: 'careers' },
    { name: 'validFrom', label: 'Vigente desde', placeholder: 'Ej. Marzo 2026' },
    { name: 'subjectsCount', label: 'Cantidad de asignaturas', placeholder: 'Ej. 42', type: 'number', min: '1', max: '200' },
    { name: 'code', label: 'Código', placeholder: 'Ej. ARQ-001' },
  ],
  subject: [
    { name: 'name', label: 'Nombre de la asignatura', placeholder: 'Ej. Desarrollo de Aplicaciones II' },
    { name: 'code', label: 'Código', placeholder: 'Ej. ARQ1-001' },
    { name: 'career', label: 'Carrera', placeholder: 'Seleccioná una carrera', optionsKey: 'careers' },
    { name: 'plan', label: 'Plan de estudio', placeholder: 'Seleccioná un plan', optionsKey: 'plans' },
    { name: 'year', label: 'Año / nivel', placeholder: 'Ej. 3.º año' },
    { name: 'credits', label: 'Créditos', placeholder: 'Ej. 6', type: 'number', min: '1', max: '30' },
  ],
  campus: [
    { name: 'name', label: 'Nombre de la sede', placeholder: 'Ej. Monserrat' },
  ],
  room: [
    { name: 'name', label: 'Nombre del aula', placeholder: 'Ej. Aula 204' },
    { name: 'campus', label: 'Sede', placeholder: 'Seleccioná una sede', optionsKey: 'campuses' },
    { name: 'type', label: 'Tipo de espacio', placeholder: 'Ej. Aula teórica' },
    { name: 'capacity', label: 'Capacidad máxima', placeholder: 'Ej. 42', type: 'number', min: '1', max: '1000' },
  ],
  assignment: [
    { name: 'course', label: 'Asignatura', placeholder: 'Seleccioná una asignatura', optionsKey: 'subjects' },
    { name: 'room', label: 'Aula', placeholder: 'Seleccioná un aula', optionsKey: 'rooms' },
    { name: 'day', label: 'Día', placeholder: 'Seleccioná un día', optionsKey: 'days' },
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

export function Modal({ target, initialValues = {}, close, onSave, catalogs }: ModalProps) {
  const formId = useId()
  const dialogRef = useRef<HTMLFormElement>(null)
  const closeRef = useRef(close)
  useEffect(() => {
    closeRef.current = close
  }, [close])
  const fields = fieldMap[target.kind]
  const [values, setValues] = useState<ModalValues>(() => ({
    ...initialValues,
    ...(target.kind === 'career' && initialValues.duration
      ? { duration: initialValues.duration.match(/^\d+/)?.[0] ?? '' }
      : {}),
  }))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const title = target.id ? `Editar ${titles[target.kind].noun}` : titles[target.kind].create

  useEffect(() => {
    const dialog = dialogRef.current
    const focoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const elementosFocoables = () => Array.from(dialog?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? []).filter((element) => element.getClientRects().length > 0)
    elementosFocoables()[0]?.focus()
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const manejarTeclado = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const elementos = elementosFocoables()
      const inicio = elementos[0]
      const final = elementos[elementos.length - 1]
      if (!inicio || !final) return
      if (event.shiftKey && (document.activeElement === inicio || !dialog?.contains(document.activeElement))) {
        event.preventDefault()
        final.focus()
      } else if (!event.shiftKey && (document.activeElement === final || !dialog?.contains(document.activeElement))) {
        event.preventDefault()
        inicio.focus()
      }
    }

    dialog?.addEventListener('keydown', manejarTeclado)
    return () => {
      dialog?.removeEventListener('keydown', manejarTeclado)
      document.body.style.overflow = overflowAnterior
      focoAnterior?.focus()
    }
  }, [])

  const update = (name: string, value: string) => {
    setValues((current) => ({
      ...current,
      [name]: name === 'code' ? normalizarCodigoAcademico(value) : value,
      ...(name === 'career' && target.kind === 'subject' ? { plan: '' } : {}),
    }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setSubmitError('')
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = validate(values, fields)
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors)
      setSubmitError('Revisá los campos marcados antes de guardar.')
      window.requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    const error = onSave(values)
    if (error) {
      setSubmitError(error)
      return
    }
    close()
  }

  const valuesCareer = values.career ?? ''
  const opcionesPara = (field: Field): FieldOption[] => {
    if (!field.optionsKey) return []
    const opciones: Record<CatalogKey, FieldOption[]> = {
      careers: catalogs.careers.filter((item) => item.status !== 'Inactiva').map((item) => ({ value: item.name, label: `${item.code} · ${item.name}` })),
      plans: catalogs.plans.filter((item) => item.status !== 'Inactiva' && (!valuesCareer || item.career === valuesCareer)).map((item) => ({ value: item.name, label: `${item.code} · ${item.name}` })),
      subjects: catalogs.subjects.filter((item) => item.status !== 'Inactiva').map((item) => ({ value: item.name, label: `${item.code} · ${item.name}` })),
      campuses: catalogs.campuses.map((item) => ({ value: item.name, label: item.name })),
      rooms: catalogs.rooms.filter((item) => item.status !== 'Inactiva').map((item) => ({ value: item.name, label: `${item.name} · ${item.campus}` })),
      days: opcionesDias,
    }
    const disponibles = opciones[field.optionsKey]
    const actual = values[field.name] ?? ''
    return actual && !disponibles.some((opcion) => opcion.value === actual)
      ? [{ value: actual, label: `${actual} · valor actual` }, ...disponibles]
      : disponibles
  }

  return <div className="modal-backdrop" onPointerDown={(event) => event.target === event.currentTarget && close()}>
    <form ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby={`${formId}-title`} onSubmit={submit} noValidate>
      <div className="modal-head">
        <div><span className="form-kicker">{target.id ? 'EDITAR REGISTRO' : 'CREAR REGISTRO'} <MockTag /></span><h2 id={`${formId}-title`}>{title}</h2></div>
        <button type="button" onClick={close} aria-label="Cerrar"><X size={20} aria-hidden="true" /></button>
      </div>
      {submitError && <div className="form-error summary" role="alert">{submitError}</div>}
      {fields.map((field) => {
        const fieldId = `${formId}-${field.name}`
        const errorId = `${fieldId}-error`
        const errorProps = {
          'aria-invalid': Boolean(errors[field.name]),
          'aria-describedby': errors[field.name] ? errorId : undefined,
          required: true,
        }
        if (field.optionsKey || field.name === 'year') {
          const opciones = field.name === 'year'
            ? opcionesAnio.map((anio) => ({ value: `${anio}.º año`, label: `${anio}.º año` }))
            : opcionesPara(field)
          return <label key={field.name} htmlFor={fieldId}>
            {field.label}
            <select
              id={fieldId}
              value={values[field.name] ?? ''}
              onChange={(event) => update(field.name, event.target.value)}
              disabled={opciones.length === 0 || (field.optionsKey === 'plans' && target.kind === 'subject' && !valuesCareer)}
              {...errorProps}
            >
              <option value="">{opciones.length ? field.placeholder : `No hay opciones para ${field.label.toLowerCase()}`}</option>
              {opciones.map((opcion) => <option key={opcion.value} value={opcion.value}>{opcion.label}</option>)}
            </select>
            {errors[field.name] && <small id={errorId} className="field-error">{errors[field.name]}</small>}
          </label>
        }
        if (field.type === 'date') {
          return <div className="modal-date-field" key={field.name}>
            <CalendarDatePicker label={field.label} value={values[field.name] ?? ''} onChange={(value) => update(field.name, value)} placeholder={field.placeholder} ariaInvalid={Boolean(errors[field.name])} ariaDescribedBy={errors[field.name] ? errorId : undefined} />
            {errors[field.name] && <small id={errorId} className="field-error">{errors[field.name]}</small>}
          </div>
        }
        return <label key={field.name} htmlFor={fieldId}>
          {field.label}
          <input id={fieldId} value={values[field.name] ?? ''} onChange={(event) => update(field.name, event.target.value)} type={field.type ?? 'text'} min={field.min} max={field.max} step={field.step} placeholder={field.placeholder} {...errorProps} />
          {errors[field.name] && <small id={errorId} className="field-error">{errors[field.name]}</small>}
        </label>
      })}
      <div className="modal-actions"><button className="secondary-button" type="button" onClick={close}>Cancelar</button><button className="primary-button" type="submit"><Check size={17} aria-hidden="true" /> {target.id ? 'Guardar cambios' : 'Guardar mock'}</button></div>
    </form>
  </div>
}
