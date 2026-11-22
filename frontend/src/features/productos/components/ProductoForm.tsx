import { useForm } from '@tanstack/react-form'
import type { Categoria } from '@/features/categorias/types/categoria'
import { Alerta } from '@/shared/ui/Alerta'
import { Button } from '@/shared/ui/Button'
import { Input, Select, Textarea } from '@/shared/ui/Input'
import type { Producto, ProductoCreate } from '../types/producto'

interface ProductoFormProps {
  inicial?: Producto
  categorias: Categoria[]
  error?: string
  onGuardar: (datos: ProductoCreate) => Promise<void>
  onCancelar: () => void
}

const URL_REGEX = /^https?:\/\/\S+$/

function validarEnteroNoNegativo(valor: string): string | undefined {
  if (valor.trim() === '') return 'Campo obligatorio'
  const numero = Number(valor)
  return Number.isInteger(numero) && numero >= 0 ? undefined : 'Debe ser un número entero mayor o igual a 0'
}

export function ProductoForm({ inicial, categorias, error, onGuardar, onCancelar }: ProductoFormProps) {
  // Si la categoría del producto fue dada de baja, se la muestra igual para no perder el dato.
  const opciones =
    inicial && !categorias.some((categoria) => categoria.id === inicial.categoria_id)
      ? [...categorias, { ...inicial.categoria, nombre: `${inicial.categoria.nombre} (dada de baja)` }]
      : categorias

  const form = useForm({
    defaultValues: {
      nombre: inicial?.nombre ?? '',
      descripcion: inicial?.descripcion ?? '',
      precio_base: inicial ? String(inicial.precio_base) : '',
      imagen_url: inicial?.imagen_url ?? '',
      stock: inicial ? String(inicial.stock) : '0',
      disponible: inicial?.disponible ?? true,
      categoria_id: inicial ? String(inicial.categoria_id) : '',
    },
    onSubmit: async ({ value }) =>
      onGuardar({
        nombre: value.nombre.trim(),
        descripcion: value.descripcion.trim() || null,
        precio_base: Number(value.precio_base),
        imagen_url: value.imagen_url.trim() || null,
        stock: Number(value.stock),
        disponible: value.disponible,
        categoria_id: Number(value.categoria_id),
      }),
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
            if (largo === 0) return 'El nombre es obligatorio'
            if (largo > 150) return 'Máximo 150 caracteres'
            return undefined
          },
        }}
      >
        {(field) => (
          <Input
            id="producto-nombre"
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
        validators={{ onChange: ({ value }) => (value.length > 1000 ? 'Máximo 1000 caracteres' : undefined) }}
      >
        {(field) => (
          <Textarea
            id="producto-descripcion"
            label="Descripción (opcional)"
            rows={2}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(evento) => field.handleChange(evento.target.value)}
            error={field.state.meta.errors[0]}
          />
        )}
      </form.Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <form.Field
          name="precio_base"
          validators={{
            onChange: ({ value }) => {
              if (value.trim() === '') return 'El precio es obligatorio'
              const numero = Number(value)
              return Number.isFinite(numero) && numero >= 0 ? undefined : 'Debe ser un número mayor o igual a 0'
            },
          }}
        >
          {(field) => (
            <Input
              id="producto-precio"
              label="Precio base ($)"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(evento) => field.handleChange(evento.target.value)}
              error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
            />
          )}
        </form.Field>

        <form.Field name="stock" validators={{ onChange: ({ value }) => validarEnteroNoNegativo(value) }}>
          {(field) => (
            <Input
              id="producto-stock"
              label="Stock"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(evento) => field.handleChange(evento.target.value)}
              error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
            />
          )}
        </form.Field>
      </div>

      <form.Field
        name="categoria_id"
        validators={{ onChange: ({ value }) => (value ? undefined : 'Elegí una categoría') }}
      >
        {(field) => (
          <Select
            id="producto-categoria"
            label="Categoría"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(evento) => field.handleChange(evento.target.value)}
            error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
          >
            <option value="">Seleccioná…</option>
            {opciones.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </Select>
        )}
      </form.Field>

      <form.Field
        name="imagen_url"
        validators={{
          onChange: ({ value }) =>
            value.trim() === '' || URL_REGEX.test(value.trim()) ? undefined : 'Debe ser una URL http(s) válida',
        }}
      >
        {(field) => (
          <Input
            id="producto-imagen"
            label="URL de la imagen (opcional)"
            type="url"
            placeholder="https://…"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(evento) => field.handleChange(evento.target.value)}
            error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
          />
        )}
      </form.Field>

      <form.Field name="disponible">
        {(field) => (
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={field.state.value}
              onChange={(evento) => field.handleChange(evento.target.checked)}
              className="size-4 accent-orange-600"
            />
            Disponible para la venta
          </label>
        )}
      </form.Field>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variante="secundario" onClick={onCancelar}>
          Cancelar
        </Button>
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit} cargando={isSubmitting}>
              {inicial ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
