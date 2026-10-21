import { CheckCircle, WarningCircle } from '@phosphor-icons/react'

export function Toast({ message }: { message: string }) {
  const warning = /debe|seleccioná|completá|fecha|código/i.test(message)
  return <div className={`toast${warning ? ' toast-warning' : ''}`} role={warning ? 'alert' : 'status'} aria-live={warning ? 'assertive' : 'polite'}>
    {warning ? <WarningCircle size={20} weight="fill" aria-hidden="true" /> : <CheckCircle size={20} weight="fill" aria-hidden="true" />}
    <span>{message}</span>
  </div>
}
