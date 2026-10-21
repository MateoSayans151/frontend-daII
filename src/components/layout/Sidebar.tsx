import { CaretDown, SignOut, X } from '@phosphor-icons/react'
import { navGroups } from '../../app/navigation'
import type { Screen } from '../../types/domain'

type SidebarProps = {
  screen: Screen
  open: boolean
  navigate: (screen: Screen) => void
  close: () => void
  perfilNombre?: string
  perfilSubtitulo?: string
  onLogout?: () => void
}

export function Sidebar({
  screen,
  open,
  navigate,
  close,
  perfilNombre = 'Secretaría Académica',
  perfilSubtitulo = 'Administrativo',
  onLogout,
}: SidebarProps) {
  return <aside
    id="uadenet-sidebar"
    className={`sidebar ${open ? 'open' : ''}`}
    role={open ? 'dialog' : undefined}
    aria-modal={open || undefined}
    aria-label={open ? 'Menú de navegación' : undefined}
  >
    <div className="brand"><span className="brand-mark">U</span><span><strong>UADEnet</strong><small>Gestión académica</small></span><button className="close-sidebar" onClick={close} aria-label="Cerrar menú"><X size={20} /></button></div>
    <nav className="sidebar-scroll" aria-label="Secciones">
      {navGroups.map((group) => <div className="nav-group" key={group.label}>
        <p>{group.label}</p>
        {group.items.map(({ name, icon: IconComponent }) => {
          const active = screen === name
          return <button type="button" key={name} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} onClick={() => navigate(name)}>
            <IconComponent size={19} weight={active ? 'fill' : 'regular'} />{name}
          </button>
        })}
      </div>)}
    </nav>
    <div className="profile">
      <span className="profile-avatar">SA</span>
      <span><strong>{perfilNombre}</strong><small>{perfilSubtitulo}</small></span>
      {onLogout
        ? <button type="button" className="logout-button" onClick={onLogout} aria-label="Cerrar sesión"><SignOut size={17} /></button>
        : <CaretDown size={15} />}
    </div>
  </aside>
}
