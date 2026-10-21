type SurfaceSkeletonProps = {
  label: string
  rows?: number
  variant?: 'table' | 'cards'
}

export function SurfaceSkeleton({ label, rows = 4, variant = 'table' }: SurfaceSkeletonProps) {
  return (
    <div
      className={`surface-skeleton surface-skeleton--${variant}`}
      role="status"
      aria-label={`Cargando ${label}`}
      aria-busy="true"
    >
      <span className="surface-skeleton__message">Cargando {label}…</span>
      <div className="surface-skeleton__items" aria-hidden="true">
        {Array.from({ length: rows }, (_, index) => (
          variant === 'cards' ? (
            <div className="surface-skeleton__card" key={index}>
              <i className="surface-skeleton__bar surface-skeleton__bar--heading" />
              <i className="surface-skeleton__bar" />
              <i className="surface-skeleton__bar surface-skeleton__bar--short" />
            </div>
          ) : (
            <div className="surface-skeleton__row" key={index}>
              <i />
              <i />
              <i />
              <i />
            </div>
          )
        ))}
      </div>
    </div>
  )
}
