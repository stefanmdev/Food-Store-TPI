import { ETIQUETA_ESTADO, type EstadoPedido } from '@/features/pedidos/types/pedido'

const COLORES: Record<EstadoPedido, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-800 ring-amber-300',
  EN_PREPARACION: 'bg-sky-100 text-sky-800 ring-sky-300',
  ENTREGADO: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
  CANCELADO: 'bg-stone-200 text-stone-700 ring-stone-300',
}

export function BadgeEstado({ estado }: { estado: EstadoPedido }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${COLORES[estado]}`}>
      {ETIQUETA_ESTADO[estado]}
    </span>
  )
}

interface BadgeProps {
  activo: boolean
  textoSi: string
  textoNo: string
}

/** Insignia genérica de dos estados (disponible/no disponible, activo/desactivado). */
export function BadgeBooleano({ activo, textoSi, textoNo }: BadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
        activo ? 'bg-emerald-100 text-emerald-800 ring-emerald-300' : 'bg-red-100 text-red-800 ring-red-300'
      }`}
    >
      {activo ? textoSi : textoNo}
    </span>
  )
}
