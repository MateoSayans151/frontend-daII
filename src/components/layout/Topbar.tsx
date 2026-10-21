import { Bell, List } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import type { Screen } from '../../types/domain'
import './Topbar.css'

type TopbarProps = { screen: Screen; openMenu: () => void }

export function Topbar({ screen, openMenu }: TopbarProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!notificationsOpen) return

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !notificationRef.current?.contains(event.target)) {
        setNotificationsOpen(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNotificationsOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [notificationsOpen])

  return <header className="topbar">
    <button className="mobile-menu" type="button" onClick={openMenu} aria-label="Abrir menú"><List size={22} aria-hidden="true" /></button>
    <div className="breadcrumb">Gestión académica <span>/</span> {screen}</div>
    <div className="top-actions">
      <div className="notification-anchor" ref={notificationRef}>
        <button
          className="icon-button notification-trigger"
          aria-label="Abrir notificaciones"
          aria-haspopup="dialog"
          aria-expanded={notificationsOpen}
          aria-controls="notification-panel"
          onClick={() => setNotificationsOpen((open) => !open)}
        >
          <Bell size={20} />
        </button>
        {notificationsOpen && <section className="notification-panel" id="notification-panel" aria-labelledby="notification-title">
          <div className="notification-panel-heading">
            <h2 id="notification-title">Notificaciones</h2>
          </div>
          <div className="notification-empty">
            <Bell size={22} aria-hidden="true" />
            <strong>No hay notificaciones nuevas</strong>
            <span>Cuando haya novedades, aparecerán acá.</span>
          </div>
        </section>}
      </div>
    </div>
  </header>
}
