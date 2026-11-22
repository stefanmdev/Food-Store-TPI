import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios'
import { handleApiError } from '@/shared/api/handleApiError'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { DataTable } from '@/shared/components/DataTable'
import { EstadoError } from '@/shared/components/EstadoError'
import { SkeletonFilas } from '@/shared/components/Skeleton'
import { formatFecha, formatPrecio } from '@/shared/utils/formato'
import { Alerta } from '@/shared/ui/Alerta'
import { BadgeEstado } from '@/shared/ui/BadgeEstado'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { PedidoDetalle } from '../components/PedidoDetalle'
import { useCambiarEstadoPedido, usePedidos } from '../hooks/usePedidos'
import { ESTADOS, ETIQUETA_ESTADO, TRANSICIONES, type EstadoPedido, type Pedido } from '../types/pedido'

const TEXTO_ACCION: Record<EstadoPedido, string> = {
  PENDIENTE: 'Volver a pendiente',
  EN_PREPARACION: 'Pasar a preparación',
  ENTREGADO: 'Marcar entregado',
  CANCELADO: 'Cancelar',
}

interface Cambio {
  pedido: Pedido
  estado: EstadoPedido
}

export function AdminPedidosPage() {
  const [estado, setEstado] = useState<EstadoPedido | ''>('')
  const [seleccionado, setSeleccionado] = useState<number | null>(null)
  const [cambio, setCambio] = useState<Cambio | null>(null)
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null)

  // El panel pide hasta 100 pedidos y pagina del lado del cliente con TanStack Table.
  const pedidos = usePedidos({ skip: 0, limit: 100, ...(estado && { estado }) })
  const usuarios = useUsuarios()
  const cambiarEstado = useCambiarEstadoPedido()

  const nombres = useMemo(
    () => new Map((usuarios.data ?? []).map((usuario) => [usuario.id, usuario.username])),
    [usuarios.data],
  )

  const aplicarCambio = (actual: Cambio) => {
    cambiarEstado.mutate(
      { id: actual.pedido.id, estado: actual.estado },
      {
        onSuccess: (pedido) => {
          const restituido = actual.estado === 'CANCELADO' ? ' Se restituyó el stock.' : ''
          setMensaje({ tipo: 'exito', texto: `Pedido #${pedido.id}: ${ETIQUETA_ESTADO[pedido.estado]}.${restituido}` })
        },
        onError: (error) => setMensaje({ tipo: 'error', texto: handleApiError(error) }),
        onSettled: () => setCambio(null),
      },
    )
  }

  const columnas: ColumnDef<Pedido>[] = [
      { accessorKey: 'id', header: '#', cell: ({ getValue }) => `#${getValue<number>()}` },
      {
        id: 'cliente',
        header: 'Cliente',
        accessorFn: (pedido) => nombres.get(pedido.usuario_id) ?? `Usuario ${pedido.usuario_id}`,
      },
      { accessorKey: 'created_at', header: 'Fecha', cell: ({ getValue }) => formatFecha(getValue<string>()) },
      { accessorKey: 'total', header: 'Total', cell: ({ getValue }) => formatPrecio(getValue<number>()) },
      { accessorKey: 'estado', header: 'Estado', cell: ({ getValue }) => <BadgeEstado estado={getValue<EstadoPedido>()} /> },
      {
        id: 'acciones',
        header: 'Acciones',
        enableSorting: false,
        cell: ({ row }) => {
          const pedido = row.original
          return (
            <div className="flex flex-wrap gap-2">
              <Button variante="fantasma" tamanio="sm" onClick={() => setSeleccionado(pedido.id)}>
                Ver
              </Button>
              {TRANSICIONES[pedido.estado].map((siguiente) => (
                <Button
                  key={siguiente}
                  tamanio="sm"
                  variante={siguiente === 'CANCELADO' ? 'peligro' : 'primario'}
                  onClick={() =>
                    siguiente === 'CANCELADO' ? setCambio({ pedido, estado: siguiente }) : aplicarCambio({ pedido, estado: siguiente })
                  }
                  disabled={cambiarEstado.isPending}
                >
                  {TEXTO_ACCION[siguiente]}
                </Button>
              ))}
            </div>
          )
        },
      },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold text-stone-900">Pedidos</h1>
        <div className="flex flex-col gap-1">
          <label htmlFor="filtro-estado-admin" className="text-sm font-medium text-stone-700">
            Filtrar por estado
          </label>
          <select
            id="filtro-estado-admin"
            value={estado}
            onChange={(evento) => setEstado(evento.target.value as EstadoPedido | '')}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2"
          >
            <option value="">Todos</option>
            {ESTADOS.map((valor) => (
              <option key={valor} value={valor}>
                {ETIQUETA_ESTADO[valor]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {mensaje && (
        <Alerta tipo={mensaje.tipo} onCerrar={() => setMensaje(null)}>
          {mensaje.texto}
        </Alerta>
      )}

      {pedidos.isPending ? (
        <SkeletonFilas />
      ) : pedidos.isError ? (
        <EstadoError error={pedidos.error} onReintentar={() => void pedidos.refetch()} />
      ) : (
        <DataTable
          datos={pedidos.data.items}
          columnas={columnas}
          filtroPlaceholder="Buscar por cliente, número…"
          mensajeVacio={estado ? `No hay pedidos en estado «${ETIQUETA_ESTADO[estado]}».` : 'Todavía no hay pedidos.'}
        />
      )}

      <Modal abierto={seleccionado !== null} titulo={`Pedido #${seleccionado ?? ''}`} onCerrar={() => setSeleccionado(null)} ancho="lg">
        {seleccionado !== null && <PedidoDetalle pedidoId={seleccionado} />}
      </Modal>

      <ConfirmDialog
        abierto={cambio !== null}
        titulo={`Cancelar pedido #${cambio?.pedido.id ?? ''}`}
        textoConfirmar="Sí, cancelar pedido"
        peligro
        procesando={cambiarEstado.isPending}
        onCancelar={() => setCambio(null)}
        onConfirmar={() => cambio && aplicarCambio(cambio)}
      >
        El pedido pasará a <strong>Cancelado</strong> (estado terminal) y se devolverá al stock la cantidad de cada producto.
      </ConfirmDialog>
    </div>
  )
}
