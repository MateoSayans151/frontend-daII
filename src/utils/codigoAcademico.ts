export const CODIGO_ACADEMICO_REGEX = /^[A-Z]{3}\d?-\d{3}$/

export const CODIGO_ACADEMICO_MENSAJE =
  'El código debe tener el formato ARQ-001 o ARQ1-001.'

export const normalizarCodigoAcademico = (codigo: string) => codigo.toUpperCase()

export const esCodigoAcademicoValido = (codigo: string) =>
  CODIGO_ACADEMICO_REGEX.test(codigo)
