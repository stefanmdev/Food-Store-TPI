import { formatPrecio } from '@/shared/utils/formato'
import { Button } from '@/shared/ui/Button'
import { useCartStore } from '@/store/cartStore'
import type { Producto } from '../types/producto'
import { ProductoImagen } from './ProductoImagen'

interface ProductoCardProps {
  producto: Producto
}

export function ProductoCard({ producto }: ProductoCardProps) {
  const agregar = useCartStore((state) => state.agregar)
  const enCarrito = useCartStore(
    (state) => state.items.find((item) => item.producto_id === producto.id)?.cantidad ?? 0,
  )

  const sinStock = producto.stock === 0
  const vendible = producto.disponible && !sinStock
  const alcanzoStock = enCarrito >= producto.stock

  let etiquetaBoton = 'Agregar al carrito'
  if (!producto.disponible) etiquetaBoton = 'No disponible'
  else if (sinStock) etiquetaBoton = 'Sin stock'
  else if (alcanzoStock) etiquetaBoton = 'Máximo en el carrito'

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative">
        <ProductoImagen url={producto.imagen_url} nombre={producto.nombre} className="h-40 w-full" />
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-stone-700 shadow">
          {producto.categoria.nombre}
        </span>
        {!vendible && (
          <span className="absolute right-2 top-2 rounded-full bg-stone-800/85 px-2.5 py-0.5 text-xs font-semibold text-white">
            {producto.disponible ? 'Agotado' : 'No disponible'}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold text-stone-900">{producto.nombre}</h3>
        {producto.descripcion && <p className="line-clamp-2 text-sm text-stone-600">{producto.descripcion}</p>}
        <div className="mt-auto flex items-end justify-between pt-2">
          <span className="text-lg font-bold text-orange-700">{formatPrecio(producto.precio_base)}</span>
          <span className="text-xs text-stone-500">Stock: {producto.stock}</span>
        </div>
        <Button
          onClick={() => agregar(producto)}
          disabled={!vendible || alcanzoStock}
          aria-label={`Agregar ${producto.nombre} al carrito`}
        >
          {etiquetaBoton}
        </Button>
        {enCarrito > 0 && <p className="text-center text-xs text-emerald-700">En tu carrito: {enCarrito}</p>}
      </div>
    </article>
  )
}
