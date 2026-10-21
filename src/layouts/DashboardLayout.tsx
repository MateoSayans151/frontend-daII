import { useEffect, useRef, type ReactNode } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'
import type { Screen } from '../types/domain'

type DashboardLayoutProps = {
  screen: Screen
  sidebarOpen: boolean
  navigate: (screen: Screen) => void
  closeSidebar: () => void
  openSidebar: () => void
  perfilNombre?: string
  perfilSubtitulo?: string
  onLogout?: () => void
  children: ReactNode
}

export function DashboardLayout({
  screen,
  sidebarOpen,
  navigate,
  closeSidebar,
  openSidebar,
  perfilNombre,
  perfilSubtitulo,
  onLogout,
  children,
}: DashboardLayoutProps) {
  const cerrarMenuRef = useRef(closeSidebar)

  useEffect(() => {
    cerrarMenuRef.current = closeSidebar
  }, [closeSidebar])

  useEffect(() => {
    if (!sidebarOpen) return

    const menu = document.getElementById('uadenet-sidebar')
    const focoAnterior = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const focoables = () => Array.from(menu?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? []).filter((element) => element.getClientRects().length > 0)
    const frame = window.requestAnimationFrame(() => {
      const activo = menu?.querySelector<HTMLElement>('[aria-current="page"]')
      ;(activo ?? focoables()[0])?.focus()
    })
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const manejarTeclado = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        cerrarMenuRef.current()
        return
      }
      if (event.key !== 'Tab') return

      const elementos = focoables()
      const primero = elementos[0]
      const ultimo = elementos[elementos.length - 1]
      if (!primero || !ultimo) return
      if (event.shiftKey && (document.activeElement === primero || !menu?.contains(document.activeElement))) {
        event.preventDefault()
        ultimo.focus()
      } else if (!event.shiftKey && (document.activeElement === ultimo || !menu?.contains(document.activeElement))) {
        event.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', manejarTeclado)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', manejarTeclado)
      document.body.style.overflow = overflowAnterior
      if (focoAnterior?.classList.contains('mobile-menu')) focoAnterior.focus()
    }
  }, [sidebarOpen])

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Saltar al contenido</a>
    <Sidebar
      screen={screen}
      open={sidebarOpen}
      navigate={navigate}
      close={closeSidebar}
      perfilNombre={perfilNombre}
      perfilSubtitulo={perfilSubtitulo}
      onLogout={onLogout}
    />
    {sidebarOpen && <button className="sidebar-backdrop" type="button" aria-label="Cerrar menú" onClick={closeSidebar} />}
    <section className="workspace" aria-hidden={sidebarOpen || undefined}>
      <Topbar screen={screen} openMenu={openSidebar} />
      <main id="main-content" className="page-content" tabIndex={-1}>{children}</main>
    </section>
  </div>
}
