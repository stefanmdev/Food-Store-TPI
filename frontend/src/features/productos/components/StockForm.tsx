import { useForm } from '@tanstack/react-form'
import { Alerta } from '@/shared/ui/Alerta'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import type { Producto, ProductoStockUpdate } from '../types/producto'

interface StockFormProps {
  producto: Producto
  error?: string
  onGuardar: (datos: ProductoStockUpdate) => Promise<void>
  onCancelar: () => void
}

/** Cambio rápido de stock y disponibilidad (PATCH /productos/{id}/stock). */
export function StockForm({ producto, error, onGuardar, onCancelar }: StockFormProps) {
  const form = useForm({
    defaultValues: { stock: String(producto.stock), disponible: producto.disponible },
    onSubmit: async ({ value }) => onGuardar({ stock: Number(value.stock), disponible: value.disponible }),
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
      <p className="text-sm text-stone-600">
        Producto: <strong className="text-stone-900">{producto.nombre}</strong> · stock actual {producto.stock}
      </p>
      {error && <Alerta tipo="error">{error}</Alerta>}

      <form.Field
        name="stock"
        validators={{
          onChange: ({ value }) => {
            if (value.trim() === '') return 'Campo obligatorio'
            const numero = Number(value)
            return Number.isInteger(numero) && numero >= 0 ? undefined : 'Debe ser un entero mayor o igual a 0'
          },
        }}
      >
        {(field) => (
          <Input
            id="stock-cantidad"
            label="Nuevo stock"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(evento) => field.handleChange(evento.target.value)}
            error={field.state.meta.errors[0]}
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
              Guardar stock
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
