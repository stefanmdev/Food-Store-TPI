import { axiosInstance } from '@/shared/api/axiosInstance'
import type {
  FiltrosProductos,
  Producto,
  ProductoCreate,
  ProductosPaginados,
  ProductoStockUpdate,
  ProductoUpdate,
} from '../types/producto'

export async function getProductos(filtros: FiltrosProductos): Promise<ProductosPaginados> {
  const { data } = await axiosInstance.get<ProductosPaginados>('/productos', { params: filtros })
  return data
}

export async function getProducto(id: number): Promise<Producto> {
  const { data } = await axiosInstance.get<Producto>(`/productos/${id}`)
  return data
}

export async function createProducto(datos: ProductoCreate): Promise<Producto> {
  const { data } = await axiosInstance.post<Producto>('/productos', datos)
  return data
}

export async function updateProducto(id: number, datos: ProductoUpdate): Promise<Producto> {
  const { data } = await axiosInstance.put<Producto>(`/productos/${id}`, datos)
  return data
}

export async function updateStock(id: number, datos: ProductoStockUpdate): Promise<Producto> {
  const { data } = await axiosInstance.patch<Producto>(`/productos/${id}/stock`, datos)
  return data
}

export async function deleteProducto(id: number): Promise<void> {
  await axiosInstance.delete(`/productos/${id}`)
}
