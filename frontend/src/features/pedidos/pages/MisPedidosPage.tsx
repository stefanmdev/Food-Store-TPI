import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { EstadoError } from '@/shared/components/EstadoError'
import { EstadoVacio } from '@/shared/components/EstadoVacio'
import { Paginacion } from '@/shared/components/Paginacion'
import { SkeletonFilas } from '@/shared/components/Skeleton'
import { formatFecha, formatPrecio } from '@/shared/utils/formato'
import { Alerta } from '@/shared/ui/Alerta'
import { BadgeEstado } from '@/shared/ui/BadgeEstado'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Modal } from '@/shared/ui/Modal'
import { useAuthStore } from '@/store/authStore'
import { PedidoDetalle } from '../components/PedidoDetalle'
import { usePedidos } from '../hooks/usePedidos'
import { ESTADOS, ETIQUETA_ESTADO, type EstadoPedido, type FiltrosPedidos } from '../types/pedido'

const LIMITE = 5

interface EstadoNavegacion {
  pedidoCreado?: number
  total?: number
}

export function MisPedidosPage() {
  const usuario = useAuthStore((state) => state.usuario)
  const location = useLocation()
  const navigate = useNavigate()
  // Se toma el aviso de confirmación una sola vez y se limpia el estado de navegación
  // para que no reaparezca al recargar la página.
  const [creado] = useState(() => (location.state ?? {}) as EstadoNavegacion)
  const [avisoVisible, setAvisoVisible] = useState(Boolean(creado.pedidoCreado))
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null })
  }, [location.state, location.pathname, navigate])
  const [estado, setEstado] = useState<EstadoPedido | ''>('')
  const [pagina, setPagina] = useState(0)
  const [seleccionado, setSeleccionado] = useState<number | null>(null)

  const filtros: FiltrosPedidos = { skip: pagina * LIMITE, limit: LIMITE, ...(estado && { estado }) }
  const pedidos = usePedidos(filtros)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Mis pedidos</h1>
          {usuario?.role === 'admin' && (
            <p className="text-sm text-stone-600">
              Como administrador ves todos los pedidos. Gestioná sus estados desde{' '}
              <Link to="/admin/pedidos" className="text-orange-700 underline">
                Panel admin › Pedidos
              </Link>
              .
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filtro-estado" className="text-sm font-medium text-stone-700">
            Estado
          </label>
          <select
            id="filtro-estado"
            value={estado}
            onChange={(evento) => {
              setEstado(evento.target.value as EstadoPedido | '')
              setPagina(0)
            }}
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

      {avisoVisible && creado.pedidoCreado && (
        <Alerta tipo="exito" onCerrar={() => setAvisoVisible(false)}>
          <strong>¡Pedido #{creado.pedidoCreado} confirmado!</strong>
          {creado.total !== undefined && <> Total: {formatPrecio(creado.total)}.</>} Quedó en estado Pendiente.{' '}
          <button type="button" className="font-semibold underline" onClick={() => setSeleccionado(creado.pedidoCreado ?? null)}>
            Ver detalle
          </button>
        </Alerta>
      )}

      {pedidos.isPending ? (
        <SkeletonFilas filas={LIMITE} />
      ) : pedidos.isError ? (
        <EstadoError error={pedidos.error} onReintentar={() => void pedidos.refetch()} />
      ) : pedidos.data.items.length === 0 ? (
        <EstadoVacio
          icono="🧾"
          titulo={estado ? 'No hay pedidos con ese estado' : 'Todavía no hiciste pedidos'}
          descripcion={estado ? undefined : 'Cuando confirmes un pedido lo vas a ver acá.'}
          accion={
            <Link to="/" className="rounded-lg bg-orange-600 px-4 py-2 font-medium text-white hover:bg-orange-700">
              Ir al catálogo
            </Link>
          }
        />
      ) : (
        <>
          <ul className={`space-y-3 ${pedidos.isPlaceholderData ? 'opacity-60' : ''}`}>
            {pedidos.data.items.map((pedido) => (
              <li key={pedido.id}>
                <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-stone-900">Pedido #{pedido.id}</span>
                      <BadgeEstado estado={pedido.estado} />
                    </div>
                    <p className="text-sm text-stone-600">
                      {formatFecha(pedido.created_at)} · {pedido.items.reduce((suma, item) => suma + item.cantidad, 0)}{' '}
                      producto(s)
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <span className="text-lg font-bold text-orange-700">{formatPrecio(pedido.total)}</span>
                    <Button variante="secundario" tamanio="sm" onClick={() => setSeleccionado(pedido.id)}>
                      Ver detalle
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
          <Paginacion
            total={pedidos.data.total}
            limite={LIMITE}
            pagina={pagina}
            onCambiarPagina={setPagina}
            deshabilitado={pedidos.isPlaceholderData}
          />
        </>
      )}

      <Modal
        abierto={seleccionado !== null}
        titulo={`Pedido #${seleccionado ?? ''}`}
        onCerrar={() => setSeleccionado(null)}
        ancho="lg"
      >
        {seleccionado !== null && <PedidoDetalle pedidoId={seleccionado} permitirCancelar />}
      </Modal>
    </div>
  )
}
