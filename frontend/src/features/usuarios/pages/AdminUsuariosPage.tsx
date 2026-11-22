import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { UserPublic } from '@/features/auth/types/auth'
import { handleApiError } from '@/shared/api/handleApiError'
import { DataTable } from '@/shared/components/DataTable'
import { EstadoError } from '@/shared/components/EstadoError'
import { SkeletonFilas } from '@/shared/components/Skeleton'
import { formatFecha } from '@/shared/utils/formato'
import { Alerta } from '@/shared/ui/Alerta'
import { BadgeBooleano } from '@/shared/ui/BadgeEstado'
import { Button } from '@/shared/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { useActivarUsuario, useDesactivarUsuario, useUsuarios } from '../hooks/useUsuarios'

export function AdminUsuariosPage() {
  const sesion = useAuthStore((state) => state.usuario)
  const usuarios = useUsuarios()
  const activar = useActivarUsuario()
  const desactivar = useDesactivarUsuario()
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null)

  const procesando = activar.isPending || desactivar.isPending

  const cambiarEstado = (usuario: UserPublic, activo: boolean) => {
    const mutacion = activo ? activar : desactivar
    mutacion.mutate(usuario.id, {
      onSuccess: (actualizado) =>
        setMensaje({
          tipo: 'exito',
          texto: `Usuario «${actualizado.username}» ${actualizado.disabled ? 'desactivado' : 'activado'}.`,
        }),
      onError: (error) => setMensaje({ tipo: 'error', texto: handleApiError(error) }),
    })
  }

  const columnas: ColumnDef<UserPublic>[] = [
    { accessorKey: 'username', header: 'Usuario', cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span> },
    { accessorKey: 'full_name', header: 'Nombre' },
    { accessorKey: 'email', header: 'Email' },
    {
      accessorKey: 'role',
      header: 'Rol',
      cell: ({ getValue }) => (
        <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-semibold uppercase text-stone-700">
          {getValue<string>()}
        </span>
      ),
    },
    {
      id: 'estado',
      header: 'Estado',
      accessorFn: (usuario) => (usuario.disabled ? 'Desactivado' : 'Activo'),
      cell: ({ row }) => <BadgeBooleano activo={!row.original.disabled} textoSi="Activo" textoNo="Desactivado" />,
    },
    { accessorKey: 'created_at', header: 'Alta', cell: ({ getValue }) => formatFecha(getValue<string>()) },
    {
      id: 'acciones',
      header: 'Acciones',
      enableSorting: false,
      cell: ({ row }) => {
        const usuario = row.original
        if (usuario.disabled) {
          return (
            <Button tamanio="sm" onClick={() => cambiarEstado(usuario, true)} disabled={procesando}>
              Activar
            </Button>
          )
        }
        // El botón Desactivar no se muestra en la fila del usuario de la sesión.
        if (usuario.id === sesion?.id) return <span className="text-xs text-stone-500">Tu cuenta</span>
        return (
          <Button variante="peligro" tamanio="sm" onClick={() => cambiarEstado(usuario, false)} disabled={procesando}>
            Desactivar
          </Button>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-stone-900">Usuarios</h1>

      {mensaje && (
        <Alerta tipo={mensaje.tipo} onCerrar={() => setMensaje(null)}>
          {mensaje.texto}
        </Alerta>
      )}

      {usuarios.isPending ? (
        <SkeletonFilas />
      ) : usuarios.isError ? (
        <EstadoError error={usuarios.error} onReintentar={() => void usuarios.refetch()} />
      ) : (
        <DataTable
          datos={usuarios.data}
          columnas={columnas}
          filtroPlaceholder="Buscar usuario, nombre o email…"
          mensajeVacio="No hay usuarios registrados."
        />
      )}
    </div>
  )
}
