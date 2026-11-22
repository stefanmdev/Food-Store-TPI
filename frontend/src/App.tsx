import { useEffect } from 'react'
import { AppRouter } from '@/routes/AppRouter'
import { useAuthStore } from '@/store/authStore'

export default function App() {
  const checkSession = useAuthStore((state) => state.checkSession)

  // Única llamada a la API dentro de useEffect: confirmar la sesión (cookie) al montar la aplicación.
  useEffect(() => {
    void checkSession()
  }, [checkSession])

  return <AppRouter />
}
