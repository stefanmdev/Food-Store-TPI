import { useState } from 'react'
import { useCategorias } from '@/features/categorias/hooks/useCategorias'
import { EstadoError } from '@/shared/components/EstadoError'
import { EstadoVacio } from '@/shared/components/EstadoVacio'
import { Paginacion } from '@/shared/components/Paginacion'
import { SkeletonTarjetas } from '@/shared/components/Skeleton'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { Button } from '@/shared/ui/Button'
import { ProductoCard } from '../components/ProductoCard'
import { useProductos } from '../hooks/useProductos'
import type { FiltrosProductos } from '../types/producto'

const LIMITE = 8

export function CatalogoPage() {
  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [soloDisponibles, setSoloDisponibles] = useState(false)
  const [pagina, setPagina] = useState(0)
  const busquedaDemorada = useDebouncedValue(busqueda.trim())

  const filtros: FiltrosProductos = {
    skip: pagina * LIMITE,
    limit: LIMITE,
    ...(busquedaDemorada && { search: busquedaDemorada }),
    ...(categoriaId && { categoria_id: Number(categoriaId) }),
    ...(soloDisponibles && { disponible: true }),
  }

  const productos = useProductos(filtros)
  const categorias = useCategorias()
  const hayFiltros = Boolean(busqueda || categoriaId || soloDisponibles)

  const limpiarFiltros = () => {
    setBusqueda('')
    setCategoriaId('')
    setSoloDisponibles(false)
    setPagina(0)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-linear-to-r from-orange-600 to-amber-500 px-6 py-8 text-white shadow">
        <h1 className="text-2xl font-bold sm:text-3xl">¿Qué vas a pedir hoy?</h1>
        <p className="mt-1 text-orange-50">Elegí tus productos, armá el carrito y recibí el pedido en tu casa.</p>
      </section>

      <section aria-label="Filtros" className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div className="flex flex-col gap-1">
          <label htmlFor="busqueda" className="text-sm font-medium text-stone-700">
            Buscar
          </label>
          <input
            id="busqueda"
            type="search"
            value={busqueda}
            onChange={(evento) => {
              setBusqueda(evento.target.value)
              setPagina(0)
            }}
            placeholder="Ej.: pizza, hamburguesa…"
            className="rounded-lg border border-stone-300 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="categoria" className="text-sm font-medium text-stone-700">
            Categoría
          </label>
          <select
            id="categoria"
            value={categoriaId}
            onChange={(evento) => {
              setCategoriaId(evento.target.value)
              setPagina(0)
            }}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2"
          >
            <option value="">Todas</option>
            {categorias.data?.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 py-2 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={soloDisponibles}
            onChange={(evento) => {
              setSoloDisponibles(evento.target.checked)
              setPagina(0)
            }}
            className="size-4 accent-orange-600"
          />
          Solo disponibles
        </label>
      </section>

      {productos.isPending ? (
        <SkeletonTarjetas cantidad={LIMITE} />
      ) : productos.isError ? (
        <EstadoError error={productos.error} onReintentar={() => void productos.refetch()} />
      ) : productos.data.items.length === 0 ? (
        <EstadoVacio
          icono="🔍"
          titulo="No encontramos productos"
          descripcion={hayFiltros ? 'Probá con otra búsqueda o quitá los filtros.' : 'Todavía no hay productos en el catálogo.'}
          accion={hayFiltros && <Button variante="secundario" onClick={limpiarFiltros}>Quitar filtros</Button>}
        />
      ) : (
        <>
          <div
            className={`grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-4 ${productos.isPlaceholderData ? 'opacity-60' : ''}`}
          >
            {productos.data.items.map((producto) => (
              <ProductoCard key={producto.id} producto={producto} />
            ))}
          </div>
          <Paginacion
            total={productos.data.total}
            limite={LIMITE}
            pagina={pagina}
            onCambiarPagina={setPagina}
            deshabilitado={productos.isPlaceholderData}
          />
        </>
      )}
    </div>
  )
}
