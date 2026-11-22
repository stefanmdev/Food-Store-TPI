import { Link, useNavigate } from 'react-router-dom'
import { EstadoVacio } from '@/shared/components/EstadoVacio'
import { formatPrecio } from '@/shared/utils/formato'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { useCartStore } from '@/store/cartStore'

export function CarritoPage() {
  const items = useCartStore((state) => state.items)
  const total = useCartStore((state) => state.total())
  const cambiarCantidad = useCartStore((state) => state.cambiarCantidad)
  const quitar = useCartStore((state) => state.quitar)
  const vaciar = useCartStore((state) => state.vaciar)
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <EstadoVacio
        icono="🛒"
        titulo="Tu carrito está vacío"
        descripcion="Agregá productos desde el catálogo para armar tu pedido."
        accion={
          <Link to="/" className="rounded-lg bg-orange-600 px-4 py-2 font-medium text-white hover:bg-orange-700">
            Ir al catálogo
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-stone-900">Carrito</h1>
        <Button variante="fantasma" tamanio="sm" onClick={vaciar} className="text-red-700">
          Vaciar carrito
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <ul className="space-y-3" aria-label="Productos en el carrito">
          {items.map((item) => (
            <li key={item.producto_id}>
              <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-stone-900">{item.nombre}</p>
                  <p className="text-sm text-stone-600">{formatPrecio(item.precio_unitario)} c/u</p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="flex items-center gap-1" role="group" aria-label={`Cantidad de ${item.nombre}`}>
                    <Button
                      variante="secundario"
                      tamanio="sm"
                      onClick={() => cambiarCantidad(item.producto_id, item.cantidad - 1)}
                      aria-label={`Restar una unidad de ${item.nombre}`}
                    >
                      −
                    </Button>
                    <input
                      type="number"
                      min={1}
                      value={item.cantidad}
                      onChange={(evento) => {
                        const cantidad = Math.floor(Number(evento.target.value))
                        if (Number.isFinite(cantidad) && cantidad >= 1) cambiarCantidad(item.producto_id, cantidad)
                      }}
                      className="w-16 rounded-lg border border-stone-300 px-2 py-1.5 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      aria-label={`Cantidad de ${item.nombre}`}
                    />
                    <Button
                      variante="secundario"
                      tamanio="sm"
                      onClick={() => cambiarCantidad(item.producto_id, item.cantidad + 1)}
                      aria-label={`Sumar una unidad de ${item.nombre}`}
                    >
                      +
                    </Button>
                  </div>
                  <p className="w-28 text-right font-semibold text-stone-900">
                    {formatPrecio(item.precio_unitario * item.cantidad)}
                  </p>
                  <Button
                    variante="fantasma"
                    tamanio="sm"
                    onClick={() => quitar(item.producto_id)}
                    aria-label={`Quitar ${item.nombre}`}
                    className="text-red-700"
                  >
                    Quitar
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>

        <Card className="h-fit space-y-4 p-5">
          <h2 className="text-lg font-semibold text-stone-900">Resumen</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-600">Productos</dt>
              <dd>{items.reduce((suma, item) => suma + item.cantidad, 0)}</dd>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd className="text-orange-700">{formatPrecio(total)}</dd>
            </div>
          </dl>
          <p className="text-xs text-stone-500">El stock y el precio final se confirman al crear el pedido.</p>
          <Button className="w-full" onClick={() => navigate('/checkout')}>
            Continuar con el pedido
          </Button>
          <Link to="/" className="block text-center text-sm text-orange-700 hover:underline">
            Seguir comprando
          </Link>
        </Card>
      </div>
    </div>
  )
}
