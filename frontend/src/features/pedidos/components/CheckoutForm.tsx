import { useForm } from '@tanstack/react-form'
import { Button } from '@/shared/ui/Button'
import { Input, Textarea } from '@/shared/ui/Input'
import type { FormaPago } from '../types/pedido'

export interface DatosCheckout {
  direccion_entrega: string
  forma_pago: FormaPago
  notas: string
}

interface CheckoutFormProps {
  onConfirmar: (datos: DatosCheckout) => Promise<void>
  enviando: boolean
}

const FORMAS_PAGO: { valor: FormaPago; texto: string; detalle: string }[] = [
  { valor: 'EFECTIVO', texto: 'Efectivo', detalle: 'Pagás al recibir el pedido.' },
  { valor: 'TRANSFERENCIA', texto: 'Transferencia', detalle: 'Transferís antes de la entrega.' },
]

export function CheckoutForm({ onConfirmar, enviando }: CheckoutFormProps) {
  const form = useForm({
    defaultValues: { direccion_entrega: '', forma_pago: 'EFECTIVO' as FormaPago, notas: '' } satisfies DatosCheckout,
    onSubmit: async ({ value }) => onConfirmar(value),
  })

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault()
        evento.stopPropagation()
        void form.handleSubmit()
      }}
    >
      {/* RN-06: dirección de 5 a 200 caracteres */}
      <form.Field
        name="direccion_entrega"
        validators={{
          onChange: ({ value }) => {
            const largo = value.trim().length
            if (largo < 5) return 'La dirección debe tener al menos 5 caracteres'
            if (largo > 200) return 'La dirección no puede superar los 200 caracteres'
            return undefined
          },
        }}
      >
        {(field) => (
          <Input
            id="direccion_entrega"
            label="Dirección de entrega"
            placeholder="Calle, número, piso/depto y localidad"
            autoComplete="street-address"
            maxLength={200}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(evento) => field.handleChange(evento.target.value)}
            error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
          />
        )}
      </form.Field>

      {/* RN-06: EFECTIVO o TRANSFERENCIA */}
      <form.Field name="forma_pago">
        {(field) => (
          <fieldset>
            <legend className="text-sm font-medium text-stone-700">Forma de pago</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {FORMAS_PAGO.map((opcion) => (
                <label
                  key={opcion.valor}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
                    field.state.value === opcion.valor ? 'border-orange-500 bg-orange-50' : 'border-stone-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="forma_pago"
                    value={opcion.valor}
                    checked={field.state.value === opcion.valor}
                    onChange={() => field.handleChange(opcion.valor)}
                    className="mt-1 accent-orange-600"
                  />
                  <span>
                    <span className="block font-medium text-stone-900">{opcion.texto}</span>
                    <span className="block text-xs text-stone-600">{opcion.detalle}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </form.Field>

      <form.Field
        name="notas"
        validators={{ onChange: ({ value }) => (value.length > 500 ? 'Máximo 500 caracteres' : undefined) }}
      >
        {(field) => (
          <Textarea
            id="notas"
            label="Notas (opcional)"
            rows={3}
            placeholder="Ej.: sin cebolla, tocar timbre 2B…"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(evento) => field.handleChange(evento.target.value)}
            error={field.state.meta.errors[0]}
          />
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.canSubmit}>
        {(canSubmit) => (
          <Button type="submit" className="w-full" disabled={!canSubmit} cargando={enviando}>
            Confirmar pedido
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
