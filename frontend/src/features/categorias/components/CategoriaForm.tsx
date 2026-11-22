import { useForm } from '@tanstack/react-form'
import { Alerta } from '@/shared/ui/Alerta'
import { Button } from '@/shared/ui/Button'
import { Input, Textarea } from '@/shared/ui/Input'
import type { Categoria, CategoriaCreate } from '../types/categoria'

interface CategoriaFormProps {
  inicial?: Categoria
  error?: string
  onGuardar: (datos: CategoriaCreate) => Promise<void>
  onCancelar: () => void
}

export function CategoriaForm({ inicial, error, onGuardar, onCancelar }: CategoriaFormProps) {
  const form = useForm({
    defaultValues: { nombre: inicial?.nombre ?? '', descripcion: inicial?.descripcion ?? '' },
    onSubmit: async ({ value }) =>
      onGuardar({ nombre: value.nombre.trim(), descripcion: value.descripcion.trim() || null }),
  })

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault()
        evento.stopPropagation()
        void form.handleSubmit()
      }}
    >
      {error && <Alerta tipo="error">{error}</Alerta>}

      <form.Field
        name="nombre"
        validators={{
          onChange: ({ value }) => {
            const largo = value.trim().length
            if (largo < 2) return 'El nombre debe tener al menos 2 caracteres'
            if (largo > 100) return 'Máximo 100 caracteres'
            return undefined
          },
        }}
      >
        {(field) => (
          <Input
            id="categoria-nombre"
            label="Nombre"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(evento) => field.handleChange(evento.target.value)}
            error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
          />
        )}
      </form.Field>

      <form.Field
        name="descripcion"
        validators={{ onChange: ({ value }) => (value.length > 500 ? 'Máximo 500 caracteres' : undefined) }}
      >
        {(field) => (
          <Textarea
            id="categoria-descripcion"
            label="Descripción (opcional)"
            rows={3}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(evento) => field.handleChange(evento.target.value)}
            error={field.state.meta.errors[0]}
          />
        )}
      </form.Field>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variante="secundario" onClick={onCancelar}>
          Cancelar
        </Button>
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit} cargando={isSubmitting}>
              {inicial ? 'Guardar cambios' : 'Crear categoría'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
