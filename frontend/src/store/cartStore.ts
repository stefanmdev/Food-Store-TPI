import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface ItemCarrito {
  producto_id: number
  nombre: string
  precio_unitario: number
  cantidad: number
}

interface ProductoAgregable {
  id: number
  nombre: string
  precio_base: number
}

interface CartState {
  items: ItemCarrito[]
  agregar: (producto: ProductoAgregable, cantidad?: number) => void
  quitar: (productoId: number) => void
  cambiarCantidad: (productoId: number, cantidad: number) => void
  vaciar: () => void
  total: () => number
  cantidadItems: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      agregar: (producto, cantidad = 1) =>
        set((state) => {
          const existente = state.items.find((item) => item.producto_id === producto.id)
          if (existente) {
            return {
              items: state.items.map((item) =>
                item.producto_id === producto.id ? { ...item, cantidad: item.cantidad + cantidad } : item,
              ),
            }
          }
          const nuevo: ItemCarrito = {
            producto_id: producto.id,
            nombre: producto.nombre,
            precio_unitario: producto.precio_base,
            cantidad,
          }
          return { items: [...state.items, nuevo] }
        }),

      quitar: (productoId) =>
        set((state) => ({ items: state.items.filter((item) => item.producto_id !== productoId) })),

      cambiarCantidad: (productoId, cantidad) =>
        set((state) => ({
          items:
            cantidad < 1
              ? state.items.filter((item) => item.producto_id !== productoId)
              : state.items.map((item) => (item.producto_id === productoId ? { ...item, cantidad } : item)),
        })),

      vaciar: () => set({ items: [] }),

      total: () => get().items.reduce((suma, item) => suma + item.precio_unitario * item.cantidad, 0),

      cantidadItems: () => get().items.reduce((suma, item) => suma + item.cantidad, 0),
    }),
    {
      name: 'foodstore-carrito',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
)
