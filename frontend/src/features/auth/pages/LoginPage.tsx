import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { handleApiError } from '@/shared/api/handleApiError'
import { Alerta } from '@/shared/ui/Alerta'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { useAuthStore } from '@/store/authStore'

interface EstadoNavegacion {
  from?: string
}

export function LoginPage() {
  const usuario = useAuthStore((state) => state.usuario)
  const login = useAuthStore((state) => state.login)
  const location = useLocation()
  const estado = (location.state ?? {}) as EstadoNavegacion
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { username: '', password: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        // Al guardarse el usuario en el store, el <Navigate> de abajo redirige.
        await login(value.username.trim(), value.password)
      } catch (err) {
        setError(handleApiError(err))
      }
    },
  })

  if (usuario) {
    const destino = estado.from ?? (usuario.role === 'admin' ? '/admin/resumen' : '/')
    return <Navigate to={destino} replace />
  }

  return (
    <div className="mx-auto max-w-md">
      <Card className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-stone-900">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-stone-600">Ingresá con tu usuario para comprar y ver tus pedidos.</p>

        <form
          className="mt-6 space-y-4"
          noValidate
          onSubmit={(evento) => {
            evento.preventDefault()
            evento.stopPropagation()
            void form.handleSubmit()
          }}
        >
          {estado.from && !error && <Alerta tipo="info">Iniciá sesión para continuar.</Alerta>}
          {error && <Alerta tipo="error">{error}</Alerta>}

          <form.Field
            name="username"
            validators={{ onChange: ({ value }) => (value.trim() ? undefined : 'Ingresá tu usuario') }}
          >
            {(field) => (
              <Input
                id="username"
                label="Usuario"
                autoComplete="username"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(evento) => field.handleChange(evento.target.value)}
                error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
              />
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{ onChange: ({ value }) => (value ? undefined : 'Ingresá tu contraseña') }}
          >
            {(field) => (
              <Input
                id="password"
                type="password"
                label="Contraseña"
                autoComplete="current-password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(evento) => field.handleChange(evento.target.value)}
                error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
              />
            )}
          </form.Field>

          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" className="w-full" disabled={!canSubmit} cargando={isSubmitting}>
                Ingresar
              </Button>
            )}
          </form.Subscribe>
        </form>

        <p className="mt-6 text-center text-sm text-stone-600">
          ¿No tenés cuenta?{' '}
          <Link to="/register" state={estado} className="font-medium text-orange-700 hover:underline">
            Registrate
          </Link>
        </p>
      </Card>
    </div>
  )
}
