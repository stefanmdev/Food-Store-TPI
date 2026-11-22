import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cambiarEstadoPedido,
  cancelarPedido,
  createPedido,
  getPedido,
  getPedidos,
  getResumenPedidos,
} from '../api/pedidos'
import type { EstadoPedido, FiltrosPedidos, PedidoCreate } from '../types/pedido'

export const pedidosKey = ['pedidos'] as const

export function usePedidos(filtros: FiltrosPedidos) {
  return useQuery({
    queryKey: [...pedidosKey, 'lista', filtros],
    queryFn: () => getPedidos(filtros),
    placeholderData: keepPreviousData,
  })
}

export function usePedido(id: number | null) {
  return useQuery({
    queryKey: [...pedidosKey, 'detalle', id],
    queryFn: () => getPedido(id as number),
    enabled: id !== null,
  })
}

export function useResumenPedidos() {
  return useQuery({ queryKey: [...pedidosKey, 'resumen'], queryFn: getResumenPedidos })
}

/** Crear o cancelar un pedido cambia el stock: se invalidan pedidos, resumen y productos. */
function useInvalidarPedidosYStock() {
  const queryClient = useQueryClient()
  return async () => {
    await queryClient.invalidateQueries({ queryKey: pedidosKey })
    await queryClient.invalidateQueries({ queryKey: ['productos'] })
  }
}

export function useCrearPedido() {
  const invalidar = useInvalidarPedidosYStock()
  return useMutation({ mutationFn: (datos: PedidoCreate) => createPedido(datos), onSuccess: invalidar })
}

export function useCambiarEstadoPedido() {
  const invalidar = useInvalidarPedidosYStock()
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoPedido }) => cambiarEstadoPedido(id, { estado }),
    onSuccess: invalidar,
  })
}

export function useCancelarPedido() {
  const invalidar = useInvalidarPedidosYStock()
  return useMutation({ mutationFn: (id: number) => cancelarPedido(id), onSuccess: invalidar })
}
