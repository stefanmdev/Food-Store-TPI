import { EstadoError } from '@/shared/components/EstadoError'
import { Skeleton } from '@/shared/components/Skeleton'
import { formatPrecio } from '@/shared/utils/formato'
import { Button } from '@/shared/ui/Button'
import { ResumenCard } from '../components/ResumenCard'
import { useResumenPedidos } from '../hooks/usePedidos'

export function AdminResumenPage() {
  const resumen = useResumenPedidos()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-stone-900">Resumen del negocio</h1>
        <Button variante="secundario" tamanio="sm" onClick={() => void resumen.refetch()} cargando={resumen.isFetching}>
          Actualizar
        </Button>
      </div>

      {resumen.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Cargando">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : resumen.isError ? (
        <EstadoError error={resumen.error} onReintentar={() => void resumen.refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ResumenCard titulo="Pendientes" valor={resumen.data.pendientes} icono="⏳" color="bg-amber-100" />
          <ResumenCard titulo="En preparación" valor={resumen.data.en_preparacion} icono="👨‍🍳" color="bg-sky-100" />
          <ResumenCard titulo="Entregados" valor={resumen.data.entregados} icono="✅" color="bg-emerald-100" />
          <ResumenCard titulo="Cancelados" valor={resumen.data.cancelados} icono="✖️" color="bg-stone-200" />
          <ResumenCard titulo="Pedidos de hoy" valor={resumen.data.pedidos_hoy} icono="📅" color="bg-orange-100" />
          <ResumenCard
            titulo="Ingresos (entregados)"
            valor={formatPrecio(resumen.data.ingresos_entregados)}
            icono="💰"
            color="bg-lime-100"
          />
        </div>
      )}
    </div>
  )
}
