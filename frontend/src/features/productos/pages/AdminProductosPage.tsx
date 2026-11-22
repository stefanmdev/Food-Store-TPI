import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { useCategorias } from '@/features/categorias/hooks/useCategorias'
import { handleApiError } from '@/shared/api/handleApiError'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { DataTable } from '@/shared/components/DataTable'
import { EstadoError } from '@/shared/components/EstadoError'
import { SkeletonFilas } from '@/shared/components/Skeleton'
import { formatPrecio } from '@/shared/utils/formato'
import { Alerta } from '@/shared/ui/Alerta'
import { BadgeBooleano } from '@/shared/ui/BadgeEstado'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { ProductoForm } from '../components/ProductoForm'
import { ProductoImagen } from '../components/ProductoImagen'
import { StockForm } from '../components/StockForm'
import {
  useActualizarProducto,
  useActualizarStock,
  useCrearProducto,
  useEliminarProducto,
  useProductos,
} from '../hooks/useProductos'
import type { Producto, ProductoCreate, ProductoStockUpdate } from '../types/producto'

type Dialogo =
  | { tipo: 'crear' }
  | { tipo: 'editar'; producto: Producto }
  | { tipo: 'stock'; producto: Producto }
  | { tipo: 'eliminar'; producto: Producto }

export function AdminProductosPage() {
  // El panel pide hasta 100 productos y pagina del lado del cliente con TanStack Table.
  const productos = useProductos({ skip: 0, limit: 100 })
  const categorias = useCategorias()
  const crear = useCrearProducto()
  const actualizar = useActualizarProducto()
  const actualizarStock = useActualizarStock()
  const eliminar = useEliminarProducto()

  const [dialogo, setDialogo] = useState<Dialogo | null>(null)
  const [errorForm, setErrorForm] = useState<string>()
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null)

  const abrir = (nuevo: Dialogo) => {
    setErrorForm(undefined)
    setDialogo(nuevo)
  }
  const cerrar = () => setDialogo(null)

  const guardarProducto = async (datos: ProductoCreate) => {
    try {
      if (dialogo?.tipo === 'editar') {
        const editado = await actualizar.mutateAsync({ id: dialogo.producto.id, datos })
        setMensaje({ tipo: 'exito', texto: `Producto «${editado.nombre}» actualizado.` })
      } else {
        const creado = await crear.mutateAsync(datos)
        setMensaje({ tipo: 'exito', texto: `Producto «${creado.nombre}» creado.` })
      }
      cerrar()
    } catch (error) {
      setErrorForm(handleApiError(error))
    }
  }

  const guardarStock = async (datos: ProductoStockUpdate) => {
    if (dialogo?.tipo !== 'stock') return
    try {
      const editado = await actualizarStock.mutateAsync({ id: dialogo.producto.id, datos })
      setMensaje({
        tipo: 'exito',
        texto: `«${editado.nombre}»: stock ${editado.stock}, ${editado.disponible ? 'disponible' : 'no disponible'}.`,
      })
      cerrar()
    } catch (error) {
      setErrorForm(handleApiError(error))
    }
  }

  const confirmarEliminar = () => {
    if (dialogo?.tipo !== 'eliminar') return
    const { producto } = dialogo
    eliminar.mutate(producto.id, {
      onSuccess: () => setMensaje({ tipo: 'exito', texto: `Producto «${producto.nombre}» dado de baja.` }),
      onError: (error) => setMensaje({ tipo: 'error', texto: handleApiError(error) }),
      onSettled: cerrar,
    })
  }

  const columnas: ColumnDef<Producto>[] = [
    {
      id: 'imagen',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <ProductoImagen url={row.original.imagen_url} nombre={row.original.nombre} className="size-10 rounded-md text-lg" />
      ),
    },
    { accessorKey: 'nombre', header: 'Nombre', cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span> },
    { id: 'categoria', header: 'Categoría', accessorFn: (producto) => producto.categoria.nombre },
    { accessorKey: 'precio_base', header: 'Precio', cell: ({ getValue }) => formatPrecio(getValue<number>()) },
    {
      accessorKey: 'stock',
      header: 'Stock',
      cell: ({ getValue }) => {
        const stock = getValue<number>()
        return <span className={stock === 0 ? 'font-semibold text-red-700' : ''}>{stock}</span>
      },
    },
    {
      accessorKey: 'disponible',
      header: 'Disponible',
      cell: ({ getValue }) => <BadgeBooleano activo={getValue<boolean>()} textoSi="Sí" textoNo="No" />,
    },
    {
      id: 'acciones',
      header: 'Acciones',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Button variante="secundario" tamanio="sm" onClick={() => abrir({ tipo: 'editar', producto: row.original })}>
            Editar
          </Button>
          <Button variante="secundario" tamanio="sm" onClick={() => abrir({ tipo: 'stock', producto: row.original })}>
            Stock
          </Button>
          <Button variante="peligro" tamanio="sm" onClick={() => abrir({ tipo: 'eliminar', producto: row.original })}>
            Eliminar
          </Button>
        </div>
      ),
    },
  ]

  const tituloModal =
    dialogo?.tipo === 'editar' ? 'Editar producto' : dialogo?.tipo === 'stock' ? 'Stock y disponibilidad' : 'Nuevo producto'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-stone-900">Productos</h1>
        <Button onClick={() => abrir({ tipo: 'crear' })} disabled={!categorias.data?.length}>
          + Nuevo producto
        </Button>
      </div>

      {mensaje && (
        <Alerta tipo={mensaje.tipo} onCerrar={() => setMensaje(null)}>
          {mensaje.texto}
        </Alerta>
      )}

      {productos.isPending ? (
        <SkeletonFilas />
      ) : productos.isError ? (
        <EstadoError error={productos.error} onReintentar={() => void productos.refetch()} />
      ) : (
        <DataTable
          datos={productos.data.items}
          columnas={columnas}
          filtroPlaceholder="Buscar producto o categoría…"
          mensajeVacio="No hay productos activos."
        />
      )}

      <Modal
        abierto={dialogo !== null && dialogo.tipo !== 'eliminar'}
        titulo={tituloModal}
        onCerrar={cerrar}
        ancho="lg"
      >
        {(dialogo?.tipo === 'crear' || dialogo?.tipo === 'editar') && (
          <ProductoForm
            key={dialogo.tipo === 'editar' ? dialogo.producto.id : 'nuevo'}
            inicial={dialogo.tipo === 'editar' ? dialogo.producto : undefined}
            categorias={categorias.data ?? []}
            error={errorForm}
            onGuardar={guardarProducto}
            onCancelar={cerrar}
          />
        )}
        {dialogo?.tipo === 'stock' && (
          <StockForm
            key={dialogo.producto.id}
            producto={dialogo.producto}
            error={errorForm}
            onGuardar={guardarStock}
            onCancelar={cerrar}
          />
        )}
      </Modal>

      <ConfirmDialog
        abierto={dialogo?.tipo === 'eliminar'}
        titulo="Eliminar producto"
        textoConfirmar="Sí, eliminar"
        peligro
        procesando={eliminar.isPending}
        onCancelar={cerrar}
        onConfirmar={confirmarEliminar}
      >
        Se dará de baja <strong>«{dialogo?.tipo === 'eliminar' ? dialogo.producto.nombre : ''}»</strong> (baja
        lógica): dejará de mostrarse en el catálogo. Los pedidos existentes conservan su copia del nombre y precio.
      </ConfirmDialog>
    </div>
  )
}
