import { CheckCircle, WarningCircle } from '@phosphor-icons/react'

export function Toast({ message }: { message: string }) {
  const warning = /debe|seleccioná|completá|fecha|código/i.test(message)
  return <div className={`toast${warning ? ' toast-warning' : ''}`} role={warning ? 'alert' : 'status'}>{warning ? <WarningCircle size={20} weight="fill" /> : <CheckCircle size={20} weight="fill" />}{message}</div>
}
