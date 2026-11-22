import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'

function claseEnlace({ isActive }: { isActive: boolean }) {
  return `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-orange-100 text-orange-800' : 'text-stone-700 hover:bg-stone-100'
  }`
}

export function Navbar() {
  const usuario = useAuthStore((state) => state.usuario)
  const logout = useAuthStore((state) => state.logout)
  const cantidadCarrito = useCartStore((state) => state.items.reduce((suma, item) => suma + item.cantidad, 0))
  const navigate = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [saliendo, setSaliendo] = useState(false)

  const cerrarMenu = () => setMenuAbierto(false)

  const cerrarSesion = async () => {
    setSaliendo(true)
    try {
      await logout() // los datos privados en caché se descartan en main.tsx al quedar sin usuario
    } finally {
      setSaliendo(false)
      cerrarMenu()
      navigate('/login', { replace: true })
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-orange-700" onClick={cerrarMenu}>
          <span aria-hidden>🍔</span> Food Store
        </Link>

        <button
          type="button"
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm md:hidden"
          aria-expanded={menuAbierto}
          aria-controls="menu-principal"
          onClick={() => setMenuAbierto((abierto) => !abierto)}
        >
          {menuAbierto ? 'Cerrar' : 'Menú'}
          {cantidadCarrito > 0 && !menuAbierto && <span className="ml-1 text-orange-700">({cantidadCarrito})</span>}
        </button>

        <nav
          id="menu-principal"
          aria-label="Principal"
          className={`${menuAbierto ? 'flex' : 'hidden'} absolute inset-x-0 top-full flex-col gap-1 border-b border-stone-200 bg-white px-4 pb-4 shadow-md md:static md:flex md:flex-row md:items-center md:gap-1 md:border-0 md:p-0 md:shadow-none`}
        >
          <NavLink to="/" end className={claseEnlace} onClick={cerrarMenu}>
            Catálogo
          </NavLink>
          <NavLink to="/carrito" className={claseEnlace} onClick={cerrarMenu}>
            Carrito
            {cantidadCarrito > 0 && (
              <span className="ml-1.5 rounded-full bg-orange-600 px-2 py-0.5 text-xs font-bold text-white">
                {cantidadCarrito}
              </span>
            )}
          </NavLink>
          {usuario && (
            <NavLink to="/mis-pedidos" className={claseEnlace} onClick={cerrarMenu}>
              Mis pedidos
            </NavLink>
          )}
          {usuario?.role === 'admin' && (
            <NavLink to="/admin/resumen" className={claseEnlace} onClick={cerrarMenu}>
              Panel admin
            </NavLink>
          )}

          <div className="mt-2 flex flex-col gap-2 border-t border-stone-200 pt-3 md:ml-3 md:mt-0 md:flex-row md:items-center md:border-l md:border-t-0 md:pl-3 md:pt-0">
            {usuario ? (
              <>
                <span className="text-sm text-stone-700">
                  {usuario.full_name}{' '}
                  <span className="rounded bg-stone-100 px-1.5 py-0.5 text-xs font-semibold uppercase text-stone-600">
                    {usuario.role}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={cerrarSesion}
                  disabled={saliendo}
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {saliendo ? 'Saliendo…' : 'Cerrar sesión'}
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={claseEnlace} onClick={cerrarMenu}>
                  Ingresar
                </NavLink>
                <NavLink to="/register" className={claseEnlace} onClick={cerrarMenu}>
                  Registrarse
                </NavLink>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
