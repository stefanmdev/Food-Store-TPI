export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-stone-200 ${className}`} aria-hidden />
}

/** Grilla de tarjetas de producto en carga. */
export function SkeletonTarjetas({ cantidad = 8 }: { cantidad?: number }) {
  return (
    <div role="status" aria-label="Cargando" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: cantidad }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <Skeleton className="h-40 rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="mt-4 h-9 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Filas de tabla o lista en carga. */
export function SkeletonFilas({ filas = 5 }: { filas?: number }) {
  return (
    <div role="status" aria-label="Cargando" className="space-y-3">
      {Array.from({ length: filas }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}
