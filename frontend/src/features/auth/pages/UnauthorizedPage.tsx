import { Link } from 'react-router-dom'
import { EstadoVacio } from '@/shared/components/EstadoVacio'

export function UnauthorizedPage() {
  return (
    <EstadoVacio
      icono="🔒"
      titulo="No tenés permiso para ver esta página"
      descripcion="Esta sección está reservada para usuarios con rol administrador."
      accion={
        <Link to="/" className="rounded-lg bg-orange-600 px-4 py-2 font-medium text-white hover:bg-orange-700">
          Volver al inicio
        </Link>
      }
    />
  )
}
