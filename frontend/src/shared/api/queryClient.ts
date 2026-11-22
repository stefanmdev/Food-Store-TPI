import { QueryClient } from '@tanstack/react-query'
import { statusDeError } from './handleApiError'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Los errores 4xx no se reintentan (no van a cambiar); los de red o 5xx, una vez.
      retry: (intentos, error) => {
        const status = statusDeError(error)
        if (status !== undefined && status < 500) return false
        return intentos < 1
      },
    },
  },
})
