import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCategoria, deleteCategoria, getCategorias, updateCategoria } from '../api/categorias'
import type { CategoriaCreate, CategoriaUpdate } from '../types/categoria'

export const categoriasKey = ['categorias'] as const

export function useCategorias() {
  return useQuery({ queryKey: categoriasKey, queryFn: getCategorias })
}

function useInvalidarCatalogo() {
  const queryClient = useQueryClient()
  return async () => {
    await queryClient.invalidateQueries({ queryKey: categoriasKey })
    // los productos incluyen su categoría: también se refrescan
    await queryClient.invalidateQueries({ queryKey: ['productos'] })
  }
}

export function useCrearCategoria() {
  const invalidar = useInvalidarCatalogo()
  return useMutation({
    mutationFn: (datos: CategoriaCreate) => createCategoria(datos),
    onSuccess: invalidar,
  })
}

export function useActualizarCategoria() {
  const invalidar = useInvalidarCatalogo()
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: CategoriaUpdate }) => updateCategoria(id, datos),
    onSuccess: invalidar,
  })
}

export function useEliminarCategoria() {
  const invalidar = useInvalidarCatalogo()
  return useMutation({
    mutationFn: (id: number) => deleteCategoria(id),
    onSuccess: invalidar,
  })
}
