import axios from 'axios'

export const CUENTA_DESACTIVADA = 'Cuenta de usuario desactivada'

/** Instancia única de Axios: la cookie HttpOnly viaja sola gracias a withCredentials. */
export const axiosInstance = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1').replace(/\/$/, ''),
  withCredentials: true,
  timeout: 15_000,
})

/** Rutas donde un 401 es una respuesta esperada (login fallido o sin sesión al iniciar). */
const RUTAS_AUTH = ['/auth/token', '/auth/me']

let alInvalidarSesion: () => void = () => {}

/** El authStore registra aquí cómo limpiar la sesión (evita que shared/ dependa de store/). */
export function registrarSesionInvalida(manejador: () => void): void {
  alInvalidarSesion = manejador
}

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError<{ detail?: unknown }>(error) && error.response) {
      const { status, data } = error.response
      const ruta = (error.config?.url ?? '').split('?')[0]
      const sesionVencida = status === 401 && !RUTAS_AUTH.includes(ruta)
      const cuentaDesactivada = status === 400 && data?.detail === CUENTA_DESACTIVADA
      if (sesionVencida || cuentaDesactivada) alInvalidarSesion()
    }
    return Promise.reject(error)
  },
)
