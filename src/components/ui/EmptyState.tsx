import { MagnifyingGlass } from '@phosphor-icons/react'

export function EmptyState({ query }: { query: string }) {
  const buscando = Boolean(query.trim())
  return <div className="empty-state" role="status" aria-live="polite">
    <MagnifyingGlass size={26} aria-hidden="true" />
    <strong>{buscando ? 'No encontramos resultados' : 'Todavía no hay registros'}</strong>
    <span>{buscando ? `Probá con otro término distinto de “${query.trim()}”.` : 'Cuando se agreguen registros, van a aparecer acá.'}</span>
  </div>
}
