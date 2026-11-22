import { useState } from 'react'
import { handleApiError } from '@/shared/api/handleApiError'
import { EstadoError } from '@/shared/components/EstadoError'
import { SkeletonFilas } from '@/shared/components/Skeleton'
import { formatFecha, formatPrecio } from '@/shared/utils/formato'
import { Alerta } from '@/shared/ui/Alerta'
import { BadgeEstado } from '@/shared/ui/BadgeEstado'
import { Button } from '@/shared/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { useCancelarPedido, usePedido } from '../hooks/usePedidos'

interface PedidoDetalleProps {
  pedidoId: number
  /** Muestra el botón «Cancelar pedido» al dueño cuando el pedido está PENDIENTE. */
  permitirCancelar?: boolean
}

export function PedidoDetalle({ pedidoId, permitirCancelar = false }: PedidoDetalleProps) {
  const usuario = useAuthStore((state) => state.usuario)
  const pedido = usePedido(pedidoId)
  const cancelar = useCancelarPedido()
  const [confirmando, setConfirmando] = useState(false)

  if (pedido.isPending) return <SkeletonFilas filas={4} />
  if (pedido.isError) return <EstadoError error={pedido.error} onReintentar={() => void pedido.refetch()} />

  const datos = pedido.data
  const puedeCancelar = permitirCancelar && datos.estado === 'PENDIENTE' && datos.usuario_id === usuario?.id

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <BadgeEstado estado={datos.estado} />
        <span className="text-sm text-stone-600">Creado: {formatFecha(datos.created_at)}</span>
      </div>

      <dl className="grid gap-3 rounded-lg bg-stone-50 p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-stone-600">Dirección de entrega</dt>
          <dd className="text-stone-900">{datos.direccion_entrega}</dd>
        </div>
        <div>
          <dt className="font-medium text-stone-600">Forma de pago</dt>
          <dd className="text-stone-900">{datos.forma_pago === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'}</dd>
        </div>
        {datos.notas && (
          <div className="sm:col-span-2">
            <dt className="font-medium text-stone-600">Notas</dt>
            <dd className="text-stone-900">{datos.notas}</dd>
          </div>
        )}
        <div className="sm:col-span-2">
          <dt className="font-medium text-stone-600">Última actualización</dt>
          <dd className="text-stone-900">{formatFecha(datos.updated_at)}</dd>
        </div>
      </dl>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-stone-600">
              <th scope="col" className="py-2 pr-3 font-medium">Producto</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">Precio unit.</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">Cant.</th>
              <th scope="col" className="py-2 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {datos.items.map((item) => (
              <tr key={item.producto_id} className="border-b border-stone-100">
                <td className="py-2 pr-3">{item.nombre_producto}</td>
                <td className="py-2 pr-3 text-right">{formatPrecio(item.precio_unitario)}</td>
                <td className="py-2 pr-3 text-right">{item.cantidad}</td>
                <td className="py-2 text-right font-medium">{formatPrecio(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={3} className="pt-3 text-right text-base">Total</th>
              <td className="pt-3 text-right text-base font-bold text-orange-700">{formatPrecio(datos.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {cancelar.isError && <Alerta tipo="error">{handleApiError(cancelar.error)}</Alerta>}
      {cancelar.isSuccess && <Alerta tipo="exito">Pedido cancelado. El stock de los productos fue restituido.</Alerta>}

      {puedeCancelar &&
        (confirmando ? (
          <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-red-800">¿Confirmás la cancelación del pedido #{datos.id}?</p>
            <div className="flex gap-2">
              <Button variante="secundario" tamanio="sm" onClick={() => setConfirmando(false)}>
                No
              </Button>
              <Button
                variante="peligro"
                tamanio="sm"
                cargando={cancelar.isPending}
                onClick={() => cancelar.mutate(datos.id, { onSettled: () => setConfirmando(false) })}
              >
                Sí, cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button variante="peligro" className="w-full sm:w-auto" onClick={() => setConfirmando(true)}>
            Cancelar pedido
          </Button>
        ))}
    </div>
  )
}
