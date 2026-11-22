import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { loginRequest, logoutRequest, meRequest } from '@/features/auth/api/auth'
import type { UserPublic, UsuarioSesion } from '@/features/auth/types/auth'
import { registrarSesionInvalida } from '@/shared/api/axiosInstance'

interface AuthState {
  usuario: UsuarioSesion | null
  /** true mientras checkSession confirma la sesión con /auth/me al montar la aplicación. */
  cargando: boolean
  login: (username: string, password: string) => Promise<UsuarioSesion>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
  limpiarSesion: () => void
}

function aSesion({ id, username, full_name, email, role }: UserPublic): UsuarioSesion {
  return { id, username, full_name, email, role }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      cargando: true,

      login: async (username, password) => {
        await loginRequest(username, password) // el backend deja el JWT en la cookie HttpOnly
        const usuario = aSesion(await meRequest())
        set({ usuario, cargando: false })
        return usuario
      },

      logout: async () => {
        try {
          await logoutRequest()
        } finally {
          set({ usuario: null, cargando: false })
        }
      },

      checkSession: async () => {
        try {
          set({ usuario: aSesion(await meRequest()), cargando: false })
        } catch {
          set({ usuario: null, cargando: false })
        }
      },

      limpiarSesion: () => set({ usuario: null, cargando: false }),
    }),
    {
      name: 'foodstore-auth',
      storage: createJSONStorage(() => localStorage),
      // Solo se persisten los datos del usuario; el token vive en la cookie HttpOnly.
      partialize: (state) => ({ usuario: state.usuario }),
    },
  ),
)

// Ante 401 (sesión vencida) o «Cuenta de usuario desactivada», el interceptor limpia la sesión;
// ProtectedRoute redirige a /login al quedar sin usuario.
registrarSesionInvalida(() => useAuthStore.getState().limpiarSesion())
