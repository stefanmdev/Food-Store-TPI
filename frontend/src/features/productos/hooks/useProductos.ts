import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createProducto,
  deleteProducto,
  getProductos,
  updateProducto,
  updateStock,
} from '../api/productos'
import type { FiltrosProductos, ProductoCreate, ProductoStockUpdate, ProductoUpdate } from '../types/producto'

export const productosKey = ['productos'] as const

export function useProductos(filtros: FiltrosProductos) {
  return useQuery({
    queryKey: [...productosKey, filtros],
    queryFn: () => getProductos(filtros),
    placeholderData: keepPreviousData, // mantiene la página anterior mientras llega la nueva
  })
}

function useInvalidarProductos() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: productosKey })
}

export function useCrearProducto() {
  const invalidar = useInvalidarProductos()
  return useMutation({ mutationFn: (datos: ProductoCreate) => createProducto(datos), onSuccess: invalidar })
}

export function useActualizarProducto() {
  const invalidar = useInvalidarProductos()
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ProductoUpdate }) => updateProducto(id, datos),
    onSuccess: invalidar,
  })
}

export function useActualizarStock() {
  const invalidar = useInvalidarProductos()
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ProductoStockUpdate }) => updateStock(id, datos),
    onSuccess: invalidar,
  })
}

export function useEliminarProducto() {
  const invalidar = useInvalidarProductos()
  return useMutation({ mutationFn: (id: number) => deleteProducto(id), onSuccess: invalidar })
}
