import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { handleApiError } from '@/shared/api/handleApiError'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { DataTable } from '@/shared/components/DataTable'
import { EstadoError } from '@/shared/components/EstadoError'
import { SkeletonFilas } from '@/shared/components/Skeleton'
import { Alerta } from '@/shared/ui/Alerta'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { CategoriaForm } from '../components/CategoriaForm'
import {
  useActualizarCategoria,
  useCategorias,
  useCrearCategoria,
  useEliminarCategoria,
} from '../hooks/useCategorias'
import type { Categoria, CategoriaCreate } from '../types/categoria'

type Edicion = { modo: 'crear' } | { modo: 'editar'; categoria: Categoria }

export function AdminCategoriasPage() {
  const categorias = useCategorias()
  const crear = useCrearCategoria()
  const actualizar = useActualizarCategoria()
  const eliminar = useEliminarCategoria()

  const [edicion, setEdicion] = useState<Edicion | null>(null)
  const [errorForm, setErrorForm] = useState<string>()
  const [aEliminar, setAEliminar] = useState<Categoria | null>(null)
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null)

  const abrir = (nueva: Edicion) => {
    setErrorForm(undefined)
    setEdicion(nueva)
  }

  const guardar = async (datos: CategoriaCreate) => {
    if (!edicion) return
    try {
      if (edicion.modo === 'crear') {
        const creada = await crear.mutateAsync(datos)
        setMensaje({ tipo: 'exito', texto: `Categoría «${creada.nombre}» creada.` })
      } else {
        const editada = await actualizar.mutateAsync({ id: edicion.categoria.id, datos })
        setMensaje({ tipo: 'exito', texto: `Categoría «${editada.nombre}» actualizada.` })
      }
      setEdicion(null)
    } catch (error) {
      setErrorForm(handleApiError(error)) // p. ej. 409 «Ya existe una categoría…»
    }
  }

  const confirmarEliminar = () => {
    if (!aEliminar) return
    eliminar.mutate(aEliminar.id, {
      onSuccess: () => setMensaje({ tipo: 'exito', texto: `Categoría «${aEliminar.nombre}» dada de baja.` }),
      onError: (error) => setMensaje({ tipo: 'error', texto: handleApiError(error) }),
      onSettled: () => setAEliminar(null),
    })
  }

  const columnas: ColumnDef<Categoria>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'nombre', header: 'Nombre', cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span> },
    {
      accessorKey: 'descripcion',
      header: 'Descripción',
      cell: ({ getValue }) => getValue<string | null>() ?? <span className="text-stone-400">—</span>,
    },
    {
      id: 'acciones',
      header: 'Acciones',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variante="secundario" tamanio="sm" onClick={() => abrir({ modo: 'editar', categoria: row.original })}>
            Editar
          </Button>
          <Button variante="peligro" tamanio="sm" onClick={() => setAEliminar(row.original)}>
            Eliminar
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-stone-900">Categorías</h1>
        <Button onClick={() => abrir({ modo: 'crear' })}>+ Nueva categoría</Button>
      </div>

      {mensaje && (
        <Alerta tipo={mensaje.tipo} onCerrar={() => setMensaje(null)}>
          {mensaje.texto}
        </Alerta>
      )}

      {categorias.isPending ? (
        <SkeletonFilas />
      ) : categorias.isError ? (
        <EstadoError error={categorias.error} onReintentar={() => void categorias.refetch()} />
      ) : (
        <DataTable
          datos={categorias.data}
          columnas={columnas}
          filtroPlaceholder="Buscar categoría…"
          mensajeVacio="No hay categorías activas."
        />
      )}

      <Modal
        abierto={edicion !== null}
        titulo={edicion?.modo === 'editar' ? 'Editar categoría' : 'Nueva categoría'}
        onCerrar={() => setEdicion(null)}
      >
        {edicion && (
          <CategoriaForm
            key={edicion.modo === 'editar' ? edicion.categoria.id : 'nueva'}
            inicial={edicion.modo === 'editar' ? edicion.categoria : undefined}
            error={errorForm}
            onGuardar={guardar}
            onCancelar={() => setEdicion(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        abierto={aEliminar !== null}
        titulo="Eliminar categoría"
        textoConfirmar="Sí, eliminar"
        peligro
        procesando={eliminar.isPending}
        onCancelar={() => setAEliminar(null)}
        onConfirmar={confirmarEliminar}
      >
        Se dará de baja la categoría <strong>«{aEliminar?.nombre}»</strong> (baja lógica). Su nombre no podrá
        reutilizarse y sus productos seguirán visibles en el catálogo.
      </ConfirmDialog>
    </div>
  )
}
