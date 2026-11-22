import { Link, useNavigate } from 'react-router-dom'
import { handleApiError } from '@/shared/api/handleApiError'
import { EstadoVacio } from '@/shared/components/EstadoVacio'
import { formatPrecio } from '@/shared/utils/formato'
import { Alerta } from '@/shared/ui/Alerta'
import { Card } from '@/shared/ui/Card'
import { useCartStore } from '@/store/cartStore'
import { CheckoutForm, type DatosCheckout } from '../components/CheckoutForm'
import { useCrearPedido } from '../hooks/usePedidos'

export function CheckoutPage() {
  const items = useCartStore((state) => state.items)
  const total = useCartStore((state) => state.total())
  const vaciar = useCartStore((state) => state.vaciar)
  const crearPedido = useCrearPedido()
  const navigate = useNavigate()

  const confirmar = async (datos: DatosCheckout) => {
    try {
      const pedido = await crearPedido.mutateAsync({
        items: items.map(({ producto_id, cantidad }) => ({ producto_id, cantidad })),
        forma_pago: datos.forma_pago,
        direccion_entrega: datos.direccion_entrega.trim(),
        notas: datos.notas.trim() || null,
      })
      vaciar()
      navigate('/mis-pedidos', { replace: true, state: { pedidoCreado: pedido.id, total: pedido.total } })
    } catch {
      // el mensaje se muestra desde crearPedido.error; el carrito se conserva para corregirlo
    }
  }

  if (items.length === 0 && !crearPedido.isPending) {
    return (
      <EstadoVacio
        icono="🛒"
        titulo="No hay productos para confirmar"
        descripcion="Tu carrito está vacío."
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
      <h1 className="text-2xl font-bold text-stone-900">Confirmar pedido</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card className="space-y-4 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-stone-900">Datos de entrega y pago</h2>
          {crearPedido.isError && (
            <Alerta tipo="error">
              {handleApiError(crearPedido.error)}{' '}
              <Link to="/carrito" className="font-semibold underline">
                Revisar carrito
              </Link>
            </Alerta>
          )}
          <CheckoutForm onConfirmar={confirmar} enviando={crearPedido.isPending} />
        </Card>

        <Card className="h-fit space-y-3 p-5">
          <h2 className="text-lg font-semibold text-stone-900">Tu pedido</h2>
          <ul className="divide-y divide-stone-100 text-sm">
            {items.map((item) => (
              <li key={item.producto_id} className="flex justify-between gap-3 py-2">
                <span>
                  {item.cantidad} × {item.nombre}
                </span>
                <span className="font-medium">{formatPrecio(item.precio_unitario * item.cantidad)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-stone-200 pt-3 text-base font-bold">
            <span>Total</span>
            <span className="text-orange-700">{formatPrecio(total)}</span>
          </div>
          <Link to="/carrito" className="block text-center text-sm text-orange-700 hover:underline">
            Modificar carrito
          </Link>
        </Card>
      </div>
    </div>
  )
}
