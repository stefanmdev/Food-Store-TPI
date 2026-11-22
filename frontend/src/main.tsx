import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/shared/api/queryClient'
import { useAuthStore } from '@/store/authStore'
import App from './App'
import './index.css'

// Al cerrarse o vencer la sesión se descartan de la caché los datos privados del usuario anterior.
useAuthStore.subscribe((state, previo) => {
  if (previo.usuario && !state.usuario) {
    queryClient.removeQueries({ queryKey: ['pedidos'] })
    queryClient.removeQueries({ queryKey: ['usuarios'] })
  }
})

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
