import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Rol } from '@/features/auth/types/auth'
import { useAuthStore } from '@/store/authStore'

interface ProtectedRouteProps {
  roles?: Rol[]
}

/** Sin sesión redirige a /login (recordando el destino); sin el rol requerido, a /unauthorized.
 * Es solo experiencia de usuario: la protección real la hace el backend con require_role. */
export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const usuario = useAuthStore((state) => state.usuario)
  const cargando = useAuthStore((state) => state.cargando)
  const location = useLocation()

  if (cargando) {
    return (
      <div role="status" className="flex items-center justify-center gap-3 py-20 text-stone-600">
        <span className="size-5 animate-spin rounded-full border-2 border-orange-600 border-t-transparent" aria-hidden />
        Verificando sesión…
      </div>
    )
  }
  if (!usuario) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (roles && !roles.includes(usuario.role)) return <Navigate to="/unauthorized" replace />
  return <Outlet />
}
