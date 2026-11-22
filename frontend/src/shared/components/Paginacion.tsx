import { Button } from '@/shared/ui/Button'

interface PaginacionProps {
  total: number
  limite: number
  /** Página actual, empezando en 0 (skip = pagina × limite). */
  pagina: number
  onCambiarPagina: (pagina: number) => void
  deshabilitado?: boolean
}

export function Paginacion({ total, limite, pagina, onCambiarPagina, deshabilitado = false }: PaginacionProps) {
  const paginas = Math.max(1, Math.ceil(total / limite))
  if (total === 0) return null
  const desde = pagina * limite + 1
  const hasta = Math.min(total, (pagina + 1) * limite)

  return (
    <nav aria-label="Paginación" className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-stone-600">
        Mostrando <strong>{desde}</strong>–<strong>{hasta}</strong> de <strong>{total}</strong>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variante="secundario"
          tamanio="sm"
          onClick={() => onCambiarPagina(pagina - 1)}
          disabled={deshabilitado || pagina === 0}
        >
          ← Anterior
        </Button>
        <span className="text-sm text-stone-700">
          Página {pagina + 1} de {paginas}
        </span>
        <Button
          variante="secundario"
          tamanio="sm"
          onClick={() => onCambiarPagina(pagina + 1)}
          disabled={deshabilitado || pagina + 1 >= paginas}
        >
          Siguiente →
        </Button>
      </div>
    </nav>
  )
}
