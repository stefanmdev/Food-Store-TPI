import { NavLink, Outlet } from 'react-router-dom'

const SECCIONES = [
  { to: '/admin/resumen', texto: 'Resumen' },
  { to: '/admin/categorias', texto: 'Categorías' },
  { to: '/admin/productos', texto: 'Productos' },
  { to: '/admin/pedidos', texto: 'Pedidos' },
  { to: '/admin/usuarios', texto: 'Usuarios' },
]

/** Submenú del panel de administración. */
export function AdminLayout() {
  return (
    <div className="space-y-6">
      <nav aria-label="Panel de administración" className="-mx-4 overflow-x-auto px-4">
        <ul className="flex min-w-max gap-1 rounded-xl border border-stone-200 bg-white p-1">
          {SECCIONES.map((seccion) => (
            <li key={seccion.to}>
              <NavLink
                to={seccion.to}
                className={({ isActive }) =>
                  `block rounded-lg px-4 py-2 text-sm font-medium ${
                    isActive ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-stone-100'
                  }`
                }
              >
                {seccion.texto}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Outlet />
    </div>
  )
}
